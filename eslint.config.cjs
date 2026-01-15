const globals = require("globals");
const tseslint = require("@typescript-eslint/eslint-plugin");
const tsparser = require("@typescript-eslint/parser");
const prettier = require("eslint-config-prettier");

module.exports = [
  {
    ignores: [
      "src/types/generated/**",
      "dist/**",
      "node_modules/**",
      "**/dist/**",
      "**/node_modules/**",
      // Separate packages with their own configs
      "confidential-assets/**",
      "projects/**",
    ],
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.cts", "**/*.mts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["tsconfig.json", "examples/*/tsconfig.json"],
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      // TypeScript recommended rules
      ...tseslint.configs.recommended.rules,

      // Style rules
      quotes: ["error", "double"],
      "max-len": ["error", 140],
      "max-classes-per-file": ["error", 20],

      // Allow for-of loops (airbnb disables these)
      "no-restricted-syntax": ["error", "ForInStatement", "LabeledStatement", "WithStatement"],

      // TypeScript handles these better
      "no-use-before-define": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: false }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],

      // Allow explicit any in some cases (can tighten later)
      "@typescript-eslint/no-explicit-any": "warn",

      // TODO: Enable this rule and fix {} types to use `object` or `unknown`
      "@typescript-eslint/no-empty-object-type": "off",

      // Allow require() in CJS files
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  prettier,
];
