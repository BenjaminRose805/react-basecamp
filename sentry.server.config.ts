// Sentry Server Configuration
// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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

  // Filter out noisy errors
  ignoreErrors: [
    // Network errors that are expected
    "ECONNREFUSED",
    "ENOTFOUND",
    "ETIMEDOUT",
  ],

  // Before sending, filter sensitive data
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }

    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers["authorization"];
      delete event.request.headers["cookie"];
    }

    return event;
  },
});
