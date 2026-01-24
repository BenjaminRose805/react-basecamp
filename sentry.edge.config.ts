// Sentry Edge Configuration
// This file configures the initialization of Sentry for edge features (Middleware, Edge API Routes).
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === "development",

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (set by CI/CD)
  release: process.env.SENTRY_RELEASE,
});
