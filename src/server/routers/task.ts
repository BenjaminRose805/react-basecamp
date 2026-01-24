/**
 * Task Service Router
 * Human task queue management
 */

import { z } from "zod";

import {
  router,
  publicProcedure,
  createNotFoundError,
  createPreconditionError,
} from "../trpc";

import type { Prisma } from "@prisma/client";

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  instructions: z.string().default(""),
  context: z.record(z.string(), z.unknown()).nullish(),
  workItemId: z.string().nullish(),
  executionId: z.string().nullish(),
  nodeId: z.string().nullish(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  dueDate: z.string().nullish(),
});

const listTasksSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(["pending", "in_progress", "completed", "expired"]).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  workItemId: z.string().optional(),
  executionId: z.string().optional(),
});

type TaskFilters = Omit<z.infer<typeof listTasksSchema>, "cursor" | "limit">;

function buildTaskFilter(filters: TaskFilters): Prisma.TaskWhereInput {
  const where: Prisma.TaskWhereInput = {};
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.priority) {
    where.priority = filters.priority;
  }
  if (filters.workItemId) {
    where.workItemId = filters.workItemId;
  }
  if (filters.executionId) {
    where.executionId = filters.executionId;
  }
  return where;
}

const taskInclude = {
  workItem: { select: { id: true, title: true } },
  execution: { select: { id: true, workflow: { select: { name: true } } } },
};

export const taskRouter = router({
  list: publicProcedure.input(listTasksSchema).query(async ({ ctx, input }) => {
    const { cursor, limit, ...filters } = input;
    const where = buildTaskFilter(filters);

    const tasks = await ctx.db.task.findMany({
      where,
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor } }),
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      include: taskInclude,
    });

    const hasMore = tasks.length > limit;
    const nextCursor = hasMore ? tasks.pop()?.id : undefined;
    return { items: tasks, nextCursor };
  }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: {
          workItem: true,
          execution: { include: { workflow: true } },
        },
      });

      if (!task) {
        throw createNotFoundError("Task", input.id);
      }

      return task;
    }),

  create: publicProcedure
    .input(createTaskSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.task.create({
        data: {
          title: input.title,
          instructions: input.instructions,
          context: input.context as Prisma.InputJsonValue | undefined,
          workItemId: input.workItemId ?? null,
          executionId: input.executionId ?? null,
          nodeId: input.nodeId ?? null,
          priority: input.priority,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        },
        include: {
          workItem: { select: { id: true, title: true } },
          execution: {
            select: { id: true, workflow: { select: { name: true } } },
          },
        },
      });
    }),

  start: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({ where: { id: input.id } });

      if (!task) {
        throw createNotFoundError("Task", input.id);
      }

      if (task.status !== "pending") {
        throw createPreconditionError("Can only start pending tasks");
      }

      return ctx.db.task.update({
        where: { id: input.id },
        data: { status: "in_progress" },
        include: {
          workItem: { select: { id: true, title: true } },
          execution: {
            select: { id: true, workflow: { select: { name: true } } },
          },
        },
      });
    }),

  complete: publicProcedure
    .input(
      z.object({
        id: z.string(),
        result: z.record(z.string(), z.unknown()),
        completedBy: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const task = await ctx.db.task.findUnique({ where: { id: input.id } });

      if (!task) {
        throw createNotFoundError("Task", input.id);
      }

      if (task.status === "completed" || task.status === "expired") {
        throw createPreconditionError("Task is already completed or expired");
      }

      const updatedTask = await ctx.db.task.update({
        where: { id: input.id },
        data: {
          status: "completed",
          result: input.result as Prisma.InputJsonValue,
          completedAt: new Date(),
          completedBy: input.completedBy,
        },
        include: {
          workItem: { select: { id: true, title: true } },
          execution: {
            select: { id: true, workflow: { select: { name: true } } },
          },
        },
      });

      return updatedTask;
    }),

  getPending: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.task.findMany({
      where: { status: { in: ["pending", "in_progress"] } },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      include: {
        workItem: { select: { id: true, title: true } },
        execution: {
          select: { id: true, workflow: { select: { name: true } } },
        },
      },
    });
  }),

  getStats: publicProcedure.query(async ({ ctx }) => {
    const [pending, inProgress, completedToday, overdue] = await Promise.all([
      ctx.db.task.count({ where: { status: "pending" } }),
      ctx.db.task.count({ where: { status: "in_progress" } }),
      ctx.db.task.count({
        where: {
          status: "completed",
          completedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      ctx.db.task.count({
        where: {
          status: { in: ["pending", "in_progress"] },
          dueDate: { lt: new Date() },
        },
      }),
    ]);

    return { pending, inProgress, completedToday, overdue };
  }),
});
