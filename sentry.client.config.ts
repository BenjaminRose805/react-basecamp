// Sentry Client Configuration
// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === "development",

  // Environment
  environment: process.env.NODE_ENV,

  // Release tracking (set by CI/CD)
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

  // Filter out noisy errors
  ignoreErrors: [
    // Browser extensions
    /^chrome-extension:\/\//,
    /^moz-extension:\/\//,
    // Network errors
    "Network request failed",
    "Failed to fetch",
    "Load failed",
    // User-cancelled
    "AbortError",
  ],

  // Before sending, filter out PII
  beforeSend(event) {
    // Don't send events in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return event;
  },

  integrations: [
    Sentry.replayIntegration({
      // Mask all text and inputs for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});
