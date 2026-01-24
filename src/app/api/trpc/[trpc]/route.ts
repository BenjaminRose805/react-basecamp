/**
 * tRPC API Route Handler for Next.js App Router
 */

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";

import { appRouter } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    ...(process.env.NODE_ENV === "development" && {
      onError: ({ path, error }) => {
        console.error(
          `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`
        );
      },
    }),
  });

export { handler as GET, handler as POST };
