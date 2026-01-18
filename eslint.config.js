import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import importX from "eslint-plugin-import-x";
import jsxA11y from "eslint-plugin-jsx-a11y";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  // Ignore patterns
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/coverage/**",
      "**/*.d.ts",
      "**/playwright-results/**",
    ],
  },

  // Base JavaScript/TypeScript rules
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2022,
      },
    },
  },
  {
    plugins: {
      "unused-imports": unusedImports,
    },
    rules: {
      // Dead code prevention
      "no-empty-function": "error",
      "unused-imports/no-unused-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],

      // Code complexity (matches CLAUDE.md limits)
      "max-lines-per-function": [
        "warn",
        { max: 30, skipBlankLines: true, skipComments: true },
      ],
      complexity: ["warn", 10],
      "max-depth": ["warn", 4],
      "max-params": ["warn", 4],

      // Best practices
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],
      "no-var": "error",
      "prefer-const": "error",
      "prefer-template": "warn",

      // Disable base rule in favor of TypeScript version
      "no-unused-vars": "off",
    },
  },

  // Import organization
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "import-x": importX,
    },
    settings: {
      "import-x/resolver": {
        typescript: true,
        node: true,
      },
    },
    rules: {
      "import-x/no-duplicates": "error",
      "import-x/no-cycle": ["error", { maxDepth: 10 }],
      "import-x/no-self-import": "error",
      "import-x/order": [
        "warn",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      "import-x/first": "error",
      "import-x/newline-after-import": "warn",
      "import-x/no-useless-path-segments": "warn",
    },
  },

  // React rules
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      react,
      "react-hooks": reactHooks,
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/button-has-type": "error",
      "react/jsx-no-target-blank": "error",
      "react/jsx-key": "error",
      "react/no-array-index-key": "warn",
      "react/no-danger": "warn",
      "react/self-closing-comp": "warn",
    },
  },

  // Next.js rules
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      "@next/next/no-img-element": "error",
      "@next/next/no-html-link-for-pages": "error",
      "@next/next/no-sync-scripts": "error",
      "@next/next/google-font-display": "warn",
      "@next/next/no-head-import-in-document": "error",
      "@next/next/no-duplicate-head": "error",
      "@next/next/no-script-component-in-head": "error",
    },
  },

  // Accessibility rules
  {
    files: ["**/*.{jsx,tsx}"],
    plugins: {
      "jsx-a11y": jsxA11y,
    },
    rules: {
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/anchor-is-valid": "error",
      "jsx-a11y/click-events-have-key-events": "error",
      "jsx-a11y/no-static-element-interactions": "error",
      "jsx-a11y/aria-props": "error",
      "jsx-a11y/aria-role": "error",
      "jsx-a11y/aria-unsupported-elements": "error",
      "jsx-a11y/heading-has-content": "error",
      "jsx-a11y/html-has-lang": "error",
      "jsx-a11y/img-redundant-alt": "warn",
      "jsx-a11y/interactive-supports-focus": "error",
      "jsx-a11y/label-has-associated-control": "error",
      "jsx-a11y/no-autofocus": "warn",
      "jsx-a11y/no-redundant-roles": "warn",
      "jsx-a11y/role-has-required-aria-props": "error",
      "jsx-a11y/role-supports-aria-props": "error",
      "jsx-a11y/tabindex-no-positive": "warn",
    },
  },
];
