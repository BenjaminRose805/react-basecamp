/**
 * lint-staged configuration
 *
 * Runs linting and formatting on staged files only.
 */
export default {
  // TypeScript and JavaScript files: ESLint + Prettier
  '*.{js,jsx,ts,tsx}': ['eslint --fix', 'prettier --write'],

  // JSON, YAML, and Markdown files: Prettier only
  '*.{json,yaml,yml,md}': ['prettier --write'],

  // CSS and related files: Prettier only
  '*.{css,scss,less}': ['prettier --write'],
};
