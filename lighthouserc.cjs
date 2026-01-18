// Lighthouse CI Configuration
// Docs: https://github.com/GoogleChrome/lighthouse-ci

module.exports = {
  ci: {
    collect: {
      // Start the Next.js production server
      startServerCommand: 'pnpm start',
      startServerReadyPattern: 'Ready in',  // Matches "✓ Ready in" from Next.js 15
      startServerReadyTimeout: 30000,

      // URLs to audit
      url: ['http://localhost:3000/'],

      // Run multiple times for consistency
      numberOfRuns: 3,

      // Collect settings
      settings: {
        // Use desktop settings for consistency
        preset: 'desktop',
      },
    },

    assert: {
      assertions: {
        // Category scores (0-1 scale, so 0.9 = 90%)
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Core Web Vitals
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],

        // Other important metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 1800 }],
        'speed-index': ['warn', { maxNumericValue: 3400 }],
      },
    },

    upload: {
      // Use temporary public storage (no server needed)
      target: 'temporary-public-storage',
    },
  },
};
