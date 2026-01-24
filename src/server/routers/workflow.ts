/**
 * Workflow Service Router
 * CRUD operations for workflows
 */

import { z } from "zod";

import { router, publicProcedure, createNotFoundError } from "../trpc";

import type { Prisma } from "@prisma/client";

const workflowNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["start", "agent", "human", "condition", "end"]),
  name: z.string(),
  config: z.record(z.string(), z.unknown()),
  position: z.object({ x: z.number(), y: z.number() }),
});

const workflowEdgeSchema = z.object({
  id: z.string(),
  sourceId: z.string(),
  targetId: z.string(),
  condition: z.string().optional(),
  label: z.string().optional(),
  priority: z.number().optional(),
});

const schemaFieldSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean"]),
  required: z.boolean().optional(),
  default: z.unknown().optional(),
  description: z.string(),
});

const createWorkflowSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().default(""),
  nodes: z.array(workflowNodeSchema).default([]),
  edges: z.array(workflowEdgeSchema).default([]),
  inputs: z
    .object({ fields: z.array(schemaFieldSchema) })
    .default({ fields: [] }),
  outputs: z
    .object({ fields: z.array(schemaFieldSchema) })
    .default({ fields: [] }),
});

const updateWorkflowSchema = z.object({
  id: z.string(),
  expectedUpdatedAt: z.string().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  mode: z.enum(["testing", "production"]).optional(),
  nodes: z.array(workflowNodeSchema).optional(),
  edges: z.array(workflowEdgeSchema).optional(),
  inputs: z.object({ fields: z.array(schemaFieldSchema) }).optional(),
  outputs: z.object({ fields: z.array(schemaFieldSchema) }).optional(),
});

const listWorkflowsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  mode: z.enum(["testing", "production"]).optional(),
  search: z.string().optional(),
});

type UpdateWorkflowData = z.infer<typeof updateWorkflowSchema>;

function buildWorkflowUpdateData(
  data: Omit<UpdateWorkflowData, "id" | "expectedUpdatedAt">
) {
  const jsonFields = ["nodes", "edges", "inputs", "outputs"] as const;
  const result: Prisma.WorkflowUpdateInput = {};
  if (data.name !== undefined) {
    result.name = data.name;
  }
  if (data.description !== undefined) {
    result.description = data.description;
  }
  if (data.mode !== undefined) {
    result.mode = data.mode;
  }
  for (const field of jsonFields) {
    if (data[field] !== undefined) {
      result[field] = data[field] as unknown as Prisma.InputJsonValue;
    }
  }
  return result;
}

export const workflowRouter = router({
  list: publicProcedure
    .input(listWorkflowsSchema)
    .query(async ({ ctx, input }) => {
      const { cursor, limit, mode, search } = input;

      const where: Prisma.WorkflowWhereInput = {};
      if (mode) {
        where.mode = mode;
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const workflows = await ctx.db.workflow.findMany({
        where,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor } }),
        orderBy: { updatedAt: "desc" },
      });

      let nextCursor: string | undefined;
      if (workflows.length > limit) {
        const nextItem = workflows.pop();
        nextCursor = nextItem?.id;
      }

      return { items: workflows, nextCursor };
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workflow = await ctx.db.workflow.findUnique({
        where: { id: input.id },
      });

      if (!workflow) {
        throw createNotFoundError("Workflow", input.id);
      }

      return workflow;
    }),

  create: publicProcedure
    .input(createWorkflowSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workflow.create({
        data: {
          name: input.name,
          description: input.description,
          nodes: input.nodes as unknown as Prisma.InputJsonValue,
          edges: input.edges as unknown as Prisma.InputJsonValue,
          inputs: input.inputs as unknown as Prisma.InputJsonValue,
          outputs: input.outputs as unknown as Prisma.InputJsonValue,
        },
      });
    }),

  update: publicProcedure
    .input(updateWorkflowSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, expectedUpdatedAt, ...data } = input;
      const existing = await ctx.db.workflow.findUnique({ where: { id } });
      if (!existing) {
        throw createNotFoundError("Workflow", id);
      }
      if (
        expectedUpdatedAt &&
        existing.updatedAt.toISOString() !== expectedUpdatedAt
      ) {
        throw createNotFoundError("Workflow", id);
      }
      return ctx.db.workflow.update({
        where: { id },
        data: buildWorkflowUpdateData(data),
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.workflow.delete({ where: { id: input.id } });
      return { success: true };
    }),

  clone: publicProcedure
    .input(z.object({ id: z.string(), name: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const original = await ctx.db.workflow.findUnique({
        where: { id: input.id },
      });

      if (!original) {
        throw createNotFoundError("Workflow", input.id);
      }

      return ctx.db.workflow.create({
        data: {
          name: input.name ?? `${original.name} (Copy)`,
          description: original.description,
          nodes: original.nodes as Prisma.InputJsonValue,
          edges: original.edges as Prisma.InputJsonValue,
          inputs: original.inputs as Prisma.InputJsonValue,
          outputs: original.outputs as Prisma.InputJsonValue,
          mode: "testing",
        },
      });
    }),

  publish: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workflow.update({
        where: { id: input.id },
        data: { mode: "production" },
      });
    }),

  unpublish: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workflow.update({
        where: { id: input.id },
        data: { mode: "testing" },
      });
    }),
});
