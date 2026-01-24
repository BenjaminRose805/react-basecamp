/**
 * tRPC Server Configuration
 * Based on ~/basecamp/docs/architecture/api-contracts.md
 */

import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { db } from "@/lib/db";

/**
 * Context available to all tRPC procedures
 */
export interface Context {
  db: typeof db;
  requestId: string;
}

/**
 * Create context for each request
 */
export function createContext(): Context {
  return {
    db,
    requestId: crypto.randomUUID(),
  };
}

/**
 * Initialize tRPC with custom error formatter
 */
const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter: ({ shape, error }) => ({
    ...shape,
    data: {
      ...shape.data,
      zodError: error.cause instanceof ZodError ? error.cause.flatten() : null,
    },
  }),
});

/**
 * Export reusable router and procedure helpers
 */
export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

/**
 * Middleware for logging requests
 */
export const loggedProcedure = t.procedure.use(async ({ next, path }) => {
  const start = Date.now();
  const result = await next();
  const duration = Date.now() - start;

  if (process.env.NODE_ENV === "development") {
    // eslint-disable-next-line no-console
    console.log(`[tRPC] ${path} - ${duration}ms`);
  }

  return result;
});

/**
 * Helper for creating domain-specific errors
 */
export function createConflictError(
  message: string,
  cause?: Record<string, unknown>
): TRPCError {
  return new TRPCError({
    code: "CONFLICT",
    message,
    cause,
  });
}

export function createNotFoundError(resource: string, id: string): TRPCError {
  return new TRPCError({
    code: "NOT_FOUND",
    message: `${resource} not found: ${id}`,
  });
}

export function createPreconditionError(
  message: string,
  cause?: Record<string, unknown>
): TRPCError {
  return new TRPCError({
    code: "PRECONDITION_FAILED",
    message,
    cause,
  });
}
