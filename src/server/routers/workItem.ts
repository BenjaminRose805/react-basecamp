/**
 * Work Item Service Router
 * CRUD operations for work items with dependency management
 */

import { z } from "zod";

import {
  router,
  publicProcedure,
  createNotFoundError,
  createConflictError,
} from "../trpc";

const requirementSchema = z.object({
  id: z.string(),
  description: z.string(),
  priority: z.enum(["must", "should", "could", "wont"]),
  satisfied: z.boolean(),
});

const criterionSchema = z.object({
  id: z.string(),
  description: z.string(),
  verified: z.boolean(),
  verifiedBy: z.string().optional(),
  verifiedAt: z.string().optional(),
});

const createWorkItemSchema = z.object({
  title: z.string().min(1).max(500),
  type: z.enum(["epic", "story", "task", "spike", "bug", "milestone"]),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  description: z.string().default(""),
  parentId: z.string().optional(),
  labels: z.array(z.string()).default([]),
  requirements: z.array(requirementSchema).default([]),
  acceptanceCriteria: z.array(criterionSchema).default([]),
  createdBy: z.string(),
});

const updateWorkItemSchema = z.object({
  id: z.string(),
  expectedUpdatedAt: z.string().optional(),
  title: z.string().min(1).max(500).optional(),
  status: z.enum(["draft", "ready", "in_progress", "done"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  description: z.string().optional(),
  assignee: z.string().nullable().optional(),
  labels: z.array(z.string()).optional(),
  requirements: z.array(requirementSchema).optional(),
  acceptanceCriteria: z.array(criterionSchema).optional(),
});

const listWorkItemsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(["draft", "ready", "in_progress", "done"]).optional(),
  type: z
    .enum(["epic", "story", "task", "spike", "bug", "milestone"])
    .optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  parentId: z.string().optional(),
  search: z.string().optional(),
});

export const workItemRouter = router({
  list: publicProcedure
    .input(listWorkItemsSchema)
    .query(async ({ ctx, input }) => {
      const { cursor, limit, status, type, priority, parentId, search } = input;

      const workItems = await ctx.db.workItem.findMany({
        where: {
          ...(status && { status }),
          ...(type && { type }),
          ...(priority && { priority }),
          ...(parentId !== undefined && { parentId }),
          ...(search && {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          }),
        },
        take: limit + 1,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { updatedAt: "desc" },
        include: {
          parent: true,
          _count: {
            select: { children: true, dependsOn: true, dependedOnBy: true },
          },
        },
      });

      let nextCursor: string | undefined;
      if (workItems.length > limit) {
        const nextItem = workItems.pop();
        nextCursor = nextItem?.id;
      }

      return { items: workItems, nextCursor };
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const workItem = await ctx.db.workItem.findUnique({
        where: { id: input.id },
        include: {
          parent: true,
          children: true,
          dependsOn: { include: { dependency: true } },
          dependedOnBy: { include: { dependent: true } },
          currentExecution: true,
        },
      });

      if (!workItem) {
        throw createNotFoundError("WorkItem", input.id);
      }

      return workItem;
    }),

  create: publicProcedure
    .input(createWorkItemSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.workItem.create({
        data: input,
        include: { parent: true },
      });
    }),

  update: publicProcedure
    .input(updateWorkItemSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, expectedUpdatedAt, ...data } = input;

      const existing = await ctx.db.workItem.findUnique({ where: { id } });
      if (!existing) {
        throw createNotFoundError("WorkItem", id);
      }

      if (
        expectedUpdatedAt &&
        existing.updatedAt.toISOString() !== expectedUpdatedAt
      ) {
        throw createConflictError("Work item was modified by another session", {
          currentUpdatedAt: existing.updatedAt.toISOString(),
        });
      }

      return ctx.db.workItem.update({
        where: { id },
        data,
        include: { parent: true },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Remove from all dependency lists first
      await ctx.db.workItemDependency.deleteMany({
        where: {
          OR: [{ dependentId: input.id }, { dependencyId: input.id }],
        },
      });

      await ctx.db.workItem.delete({ where: { id: input.id } });
      return { success: true };
    }),

  addDependency: publicProcedure
    .input(z.object({ id: z.string(), dependsOnId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { id, dependsOnId } = input;

      if (id === dependsOnId) {
        throw createConflictError("A work item cannot depend on itself");
      }

      // TODO: Add cycle detection with graphology-dag

      await ctx.db.workItemDependency.create({
        data: { dependentId: id, dependencyId: dependsOnId },
      });

      return ctx.db.workItem.findUnique({
        where: { id },
        include: {
          dependsOn: { include: { dependency: true } },
          dependedOnBy: { include: { dependent: true } },
        },
      });
    }),

  removeDependency: publicProcedure
    .input(z.object({ id: z.string(), dependsOnId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.workItemDependency.delete({
        where: {
          dependentId_dependencyId: {
            dependentId: input.id,
            dependencyId: input.dependsOnId,
          },
        },
      });

      return ctx.db.workItem.findUnique({
        where: { id: input.id },
        include: {
          dependsOn: { include: { dependency: true } },
          dependedOnBy: { include: { dependent: true } },
        },
      });
    }),
});
