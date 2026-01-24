/**
 * Execution Service Router
 * Manage workflow executions
 */

import { Prisma } from "@prisma/client";
import { z } from "zod";

import {
  router,
  publicProcedure,
  createNotFoundError,
  createPreconditionError,
} from "../trpc";

const startExecutionSchema = z.object({
  workflowId: z.string(),
  workItemId: z.string().nullish(),
  inputs: z.record(z.string(), z.unknown()).default({}),
  triggeredBy: z.string(),
});

const listExecutionsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(["running", "completed", "failed"]).optional(),
  workflowId: z.string().optional(),
  workItemId: z.string().optional(),
});

type WorkflowNode = { id: string; type: string };

function buildNodeStates(nodes: WorkflowNode[]) {
  return nodes.map((node) => ({
    nodeId: node.id,
    status: node.type === "start" ? ("running" as const) : ("pending" as const),
  }));
}

export const executionRouter = router({
  list: publicProcedure
    .input(listExecutionsSchema)
    .query(async ({ ctx, input }) => {
      const { cursor, limit, status, workflowId, workItemId } = input;

      const where: Prisma.ExecutionWhereInput = {};
      if (status) {
        where.status = status;
      }
      if (workflowId) {
        where.workflowId = workflowId;
      }
      if (workItemId) {
        where.workItemId = workItemId;
      }

      const executions = await ctx.db.execution.findMany({
        where,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor } }),
        orderBy: { startedAt: "desc" },
        include: {
          workflow: { select: { id: true, name: true } },
          workItem: { select: { id: true, title: true } },
          _count: { select: { nodeStates: true, tasks: true } },
        },
      });

      let nextCursor: string | undefined;
      if (executions.length > limit) {
        const nextItem = executions.pop();
        nextCursor = nextItem?.id;
      }

      return { items: executions, nextCursor };
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const execution = await ctx.db.execution.findUnique({
        where: { id: input.id },
        include: {
          workflow: true,
          workItem: true,
          nodeStates: { orderBy: { startedAt: "asc" } },
          tasks: true,
        },
      });

      if (!execution) {
        throw createNotFoundError("Execution", input.id);
      }

      return execution;
    }),

  start: publicProcedure
    .input(startExecutionSchema)
    .mutation(async ({ ctx, input }) => {
      const workflow = await ctx.db.workflow.findUnique({
        where: { id: input.workflowId },
      });
      if (!workflow) {
        throw createNotFoundError("Workflow", input.workflowId);
      }

      const nodes = workflow.nodes as WorkflowNode[];
      const execution = await ctx.db.execution.create({
        data: {
          workflowId: input.workflowId,
          workItemId: input.workItemId ?? null,
          triggeredBy: input.triggeredBy,
          inputs: input.inputs as Prisma.InputJsonValue,
          nodeStates: { create: buildNodeStates(nodes) },
        },
        include: { workflow: true, nodeStates: true },
      });

      if (input.workItemId) {
        await ctx.db.workItem.update({
          where: { id: input.workItemId },
          data: { currentExecutionId: execution.id, status: "in_progress" },
        });
      }
      return execution;
    }),

  cancel: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const execution = await ctx.db.execution.findUnique({
        where: { id: input.id },
      });

      if (!execution) {
        throw createNotFoundError("Execution", input.id);
      }

      if (execution.status !== "running") {
        throw createPreconditionError("Can only cancel running executions");
      }

      return ctx.db.execution.update({
        where: { id: input.id },
        data: {
          status: "failed",
          completedAt: new Date(),
          error: {
            code: "CANCELLED",
            message: "Execution cancelled by user",
          } as Prisma.InputJsonValue,
        },
        include: { workflow: true, nodeStates: true },
      });
    }),

  retryNode: publicProcedure
    .input(z.object({ executionId: z.string(), nodeId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const nodeState = await ctx.db.nodeState.findUnique({
        where: {
          executionId_nodeId: {
            executionId: input.executionId,
            nodeId: input.nodeId,
          },
        },
      });

      if (!nodeState) {
        throw createNotFoundError(
          "NodeState",
          `${input.executionId}:${input.nodeId}`
        );
      }

      if (nodeState.status !== "failed") {
        throw createPreconditionError("Can only retry failed nodes");
      }

      return ctx.db.nodeState.update({
        where: { id: nodeState.id },
        data: {
          status: "pending",
          error: Prisma.JsonNull,
          retryCount: { increment: 1 },
        },
      });
    }),

  getNodeState: publicProcedure
    .input(z.object({ executionId: z.string(), nodeId: z.string() }))
    .query(async ({ ctx, input }) => {
      const nodeState = await ctx.db.nodeState.findUnique({
        where: {
          executionId_nodeId: {
            executionId: input.executionId,
            nodeId: input.nodeId,
          },
        },
      });

      if (!nodeState) {
        throw createNotFoundError(
          "NodeState",
          `${input.executionId}:${input.nodeId}`
        );
      }

      return nodeState;
    }),
});
