/**
 * Prompt Service Router
 * CRUD operations for prompts and folders
 */

import { z } from "zod";

import { router, publicProcedure, createNotFoundError } from "../trpc";

import type { Prisma } from "@prisma/client";

// Input schemas
const variableSchema = z.object({
  name: z.string(),
  type: z.enum(["string", "number", "boolean"]),
  required: z.boolean(),
  default: z.unknown().optional(),
  description: z.string(),
});

const createPromptSchema = z.object({
  name: z.string().min(1).max(200),
  content: z.string(),
  variables: z.array(variableSchema).default([]),
  tags: z.array(z.string()).default([]),
  folderId: z.string().nullish(),
});

const updatePromptSchema = z.object({
  id: z.string(),
  expectedUpdatedAt: z.string().optional(),
  name: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  variables: z.array(variableSchema).optional(),
  tags: z.array(z.string()).optional(),
  folderId: z.string().nullish(),
});

const listPromptsSchema = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  folderId: z.string().nullish(),
  search: z.string().optional(),
});

export const promptRouter = router({
  list: publicProcedure
    .input(listPromptsSchema)
    .query(async ({ ctx, input }) => {
      const { cursor, limit, folderId, search } = input;

      const where: Prisma.PromptWhereInput = {};
      if (folderId !== undefined) {
        where.folderId = folderId;
      }
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ];
      }

      const prompts = await ctx.db.prompt.findMany({
        where,
        take: limit + 1,
        ...(cursor && { cursor: { id: cursor } }),
        orderBy: { updatedAt: "desc" },
        include: { folder: true },
      });

      let nextCursor: string | undefined;
      if (prompts.length > limit) {
        const nextItem = prompts.pop();
        nextCursor = nextItem?.id;
      }

      return { items: prompts, nextCursor };
    }),

  get: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const prompt = await ctx.db.prompt.findUnique({
        where: { id: input.id },
        include: { folder: true },
      });

      if (!prompt) {
        throw createNotFoundError("Prompt", input.id);
      }

      return prompt;
    }),

  create: publicProcedure
    .input(createPromptSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.db.prompt.create({
        data: {
          name: input.name,
          content: input.content,
          variables: input.variables as Prisma.InputJsonValue,
          tags: input.tags as Prisma.InputJsonValue,
          folderId: input.folderId ?? null,
        },
        include: { folder: true },
      });
    }),

  update: publicProcedure
    .input(updatePromptSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, expectedUpdatedAt, ...data } = input;

      const existing = await ctx.db.prompt.findUnique({ where: { id } });
      if (!existing) {
        throw createNotFoundError("Prompt", id);
      }

      if (
        expectedUpdatedAt &&
        existing.updatedAt.toISOString() !== expectedUpdatedAt
      ) {
        throw createNotFoundError("Prompt", id);
      }

      const updateData: Prisma.PromptUpdateInput = {};
      if (data.name !== undefined) {
        updateData.name = data.name;
      }
      if (data.content !== undefined) {
        updateData.content = data.content;
      }
      if (data.variables !== undefined) {
        updateData.variables = data.variables as Prisma.InputJsonValue;
      }
      if (data.tags !== undefined) {
        updateData.tags = data.tags as Prisma.InputJsonValue;
      }
      if (data.folderId !== undefined) {
        updateData.folder = data.folderId
          ? { connect: { id: data.folderId } }
          : { disconnect: true };
      }

      return ctx.db.prompt.update({
        where: { id },
        data: updateData,
        include: { folder: true },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.prompt.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        throw createNotFoundError("Prompt", input.id);
      }

      await ctx.db.prompt.delete({ where: { id: input.id } });
      return { success: true };
    }),

  listFolders: publicProcedure
    .input(z.object({ parentId: z.string().nullish() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.promptFolder.findMany({
        where: { parentId: input.parentId ?? null },
        orderBy: { name: "asc" },
      });
    }),

  createFolder: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        parentId: z.string().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.promptFolder.create({
        data: {
          name: input.name,
          parentId: input.parentId ?? null,
        },
      });
    }),

  deleteFolder: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.promptFolder.delete({ where: { id: input.id } });
      return { success: true };
    }),
});
