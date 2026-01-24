/**
 * Root tRPC Router
 *
 * All service routers are merged here.
 * Based on ~/basecamp/docs/architecture/api-contracts.md
 */

import { router } from "../trpc";

import { agentRouter } from "./agent";
import { executionRouter } from "./execution";
import { promptRouter } from "./prompt";
import { taskRouter } from "./task";
import { workflowRouter } from "./workflow";
import { workItemRouter } from "./workItem";

export const appRouter = router({
  prompt: promptRouter,
  agent: agentRouter,
  workItem: workItemRouter,
  workflow: workflowRouter,
  execution: executionRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
