/**
 * Agent Service Router
 * CRUD operations for agents
 */

import { z } from "zod";

import { router, publicProcedure, createNotFoundError } from "../trpc";

import type { Prisma } from "@prisma/client";

const modelConfigSchema = z.object({
  provider: z.enum(["anthropic", "openai"]),
  model: z.string(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().positive().default(4096),
  fallbackModel: z.string().optional(),
});

const toolConfigSchema = z.object({
  toolId: z.string(),
  enabled: z.boolean(),
});

const createAgentSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().default(""),
  systemPromptId: z.string().nullish(),
  tools: z.array(toolConfigSchema).default([]),
  modelConfig: modelConfigSchema,
});

const updateAgentSchema = z.object({
  id: z.string(),
  expectedUpdatedAt: z.string().optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  systemPromptId: z.string().nullish(),
  tools: z.array(toolConfigSchema).optional(),
  modelConfig: modelConfigSchema.optional(),
});

const listAgentsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  status: z.enum(["draft", "published"]).optional(),
  search: z.string().optional(),
});

export const agentRouter = router({
  list: publicProcedure
    .input(listAgentsSchema)
    .query(async ({ ctx, input }) => {
      const { cursor, limit, status, search } = input;

      const where: Prisma.AgentWhereInput = {};
      if (status) {
        where.status = status;
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ];
      }

      const agents = await ctx.db.agent.findMany({
        where,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor } }),
        orderBy: { updatedAt: "desc" },
        include: { systemPrompt: true },
      });

      let nextCursor: string | undefined;
      if (agents.length > limit) {
        const nextItem = agents.pop();
        nextCursor = nextItem?.id;
      }

      return { items: agents, nextCursor };
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const agent = await ctx.db.agent.findUnique({
        where: { id: input.id },
        include: { systemPrompt: true },
      });

      if (!agent) {
        throw createNotFoundError("Agent", input.id);
      }

      return agent;
    }),

  create: publicProcedure
    .input(createAgentSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.agent.create({
        data: {
          name: input.name,
          description: input.description,
          systemPromptId: input.systemPromptId ?? null,
          tools: input.tools as Prisma.InputJsonValue,
          modelConfig: input.modelConfig as Prisma.InputJsonValue,
        },
        include: { systemPrompt: true },
      });
    }),

  update: publicProcedure
    .input(updateAgentSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, expectedUpdatedAt, ...data } = input;

      const existing = await ctx.db.agent.findUnique({ where: { id } });
      if (!existing) {
        throw createNotFoundError("Agent", id);
      }

      if (
        expectedUpdatedAt &&
        existing.updatedAt.toISOString() !== expectedUpdatedAt
      ) {
        throw createNotFoundError("Agent", id);
      }

      const updateData: Prisma.AgentUpdateInput = {};
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.description !== undefined) {
        updateData.description = data.description;
      }
      if (data.systemPromptId !== undefined) {
        updateData.systemPrompt = data.systemPromptId
          ? { connect: { id: data.systemPromptId } }
          : { disconnect: true };
      }
      if (data.tools !== undefined) {
        updateData.tools = data.tools as Prisma.InputJsonValue;
      }
      if (data.modelConfig !== undefined) {
        updateData.modelConfig = data.modelConfig as Prisma.InputJsonValue;
      }

      return ctx.db.agent.update({
        where: { id },
        data: updateData,
        include: { systemPrompt: true },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.agent.delete({ where: { id: input.id } });
      return { success: true };
    }),

  publish: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.agent.update({
        where: { id: input.id },
        data: { status: "published", publishedAt: new Date() },
        include: { systemPrompt: true },
      });
    }),

  unpublish: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.agent.update({
        where: { id: input.id },
        data: { status: "draft", publishedAt: null },
        include: { systemPrompt: true },
      });
    }),
});
