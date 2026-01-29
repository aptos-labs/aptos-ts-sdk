const globals = require("globals");
const parser = require("@typescript-eslint/parser");
const eslintPlugin = require("@typescript-eslint/eslint-plugin");
const importPlugin = require("eslint-plugin-import");
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
      parser: parser,
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: ["tsconfig.json", "examples/*/tsconfig.json"],
        ecmaVersion: "latest",
        sourceType: "module",
      },
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
        ...globals.jest,
      },
    },
    plugins: {
      "@typescript-eslint": eslintPlugin,
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".ts"],
        },
      },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
    },
    rules: {
      // ========================================
      // Best Practices (from airbnb-base)
      // ========================================
      "accessor-pairs": "off",
      "array-callback-return": ["error", { allowImplicit: true }],
      "block-scoped-var": "error",
      "class-methods-use-this": ["error", { exceptMethods: [] }],
      complexity: ["off", 20],
      "consistent-return": "error",
      curly: ["error", "multi-line"],
      "default-case": ["error", { commentPattern: "^no default$" }],
      "default-case-last": "error",
      "default-param-last": "error",
      "dot-notation": ["error", { allowKeywords: true }],
      eqeqeq: ["error", "always", { null: "ignore" }],
      "grouped-accessor-pairs": "error",
      "guard-for-in": "error",
      "no-alert": "warn",
      "no-caller": "error",
      "no-case-declarations": "error",
      "no-constructor-return": "error",
      "no-div-regex": "off",
      "no-else-return": ["error", { allowElseIf: false }],
      "no-empty-function": ["error", { allow: ["arrowFunctions", "functions", "methods"] }],
      "no-empty-pattern": "error",
      "no-eq-null": "off",
      "no-eval": "error",
      "no-extend-native": "error",
      "no-extra-bind": "error",
      "no-extra-label": "error",
      "no-fallthrough": "error",
      "no-global-assign": ["error", { exceptions: [] }],
      "no-implicit-coercion": ["off", { boolean: false, number: true, string: true, allow: [] }],
      "no-implicit-globals": "off",
      "no-implied-eval": "error",
      "no-invalid-this": "off",
      "no-iterator": "error",
      "no-labels": ["error", { allowLoop: false, allowSwitch: false }],
      "no-lone-blocks": "error",
      "no-loop-func": "error",
      "no-magic-numbers": ["off", { ignore: [], ignoreArrayIndexes: true, enforceConst: true, detectObjects: false }],
      "no-multi-str": "error",
      "no-new": "error",
      "no-new-func": "error",
      "no-new-wrappers": "error",
      "no-nonoctal-decimal-escape": "error",
      "no-octal": "error",
      "no-octal-escape": "error",
      "no-param-reassign": [
        "error",
        {
          props: true,
          ignorePropertyModificationsFor: [
            "acc", // for reduce accumulators
            "accumulator", // for reduce accumulators
            "e", // for e.returnvalue
            "ctx", // for Koa routing
            "context", // for Koa routing
            "req", // for Express requests
            "request", // for Express requests
            "res", // for Express responses
            "response", // for Express responses
            "$scope", // for Angular 1 scopes
            "staticContext", // for ReactRouter context
          ],
        },
      ],
      "no-proto": "error",
      "no-redeclare": "error",
      "no-restricted-properties": [
        "error",
        { object: "arguments", property: "callee", message: "arguments.callee is deprecated" },
        { object: "global", property: "isFinite", message: "Please use Number.isFinite instead" },
        { object: "self", property: "isFinite", message: "Please use Number.isFinite instead" },
        { object: "window", property: "isFinite", message: "Please use Number.isFinite instead" },
        { object: "global", property: "isNaN", message: "Please use Number.isNaN instead" },
        { object: "self", property: "isNaN", message: "Please use Number.isNaN instead" },
        { object: "window", property: "isNaN", message: "Please use Number.isNaN instead" },
        { property: "__defineGetter__", message: "Please use Object.defineProperty instead." },
        { property: "__defineSetter__", message: "Please use Object.defineProperty instead." },
        { object: "Math", property: "pow", message: "Use the exponentiation operator (**) instead." },
      ],
      "no-return-assign": ["error", "always"],
      "no-script-url": "error",
      "no-self-assign": ["error", { props: true }],
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-throw-literal": "error",
      "no-unmodified-loop-condition": "off",
      "no-unused-expressions": [
        "error",
        { allowShortCircuit: false, allowTernary: false, allowTaggedTemplates: false },
      ],
      "no-unused-labels": "error",
      "no-useless-call": "off",
      "no-useless-catch": "error",
      "no-useless-concat": "error",
      "no-useless-escape": "error",
      "no-useless-return": "error",
      "no-void": "error",
      "no-warning-comments": ["off", { terms: ["todo", "fixme", "xxx"], location: "start" }],
      "no-with": "error",
      "prefer-promise-reject-errors": ["error", { allowEmptyReject: true }],
      "prefer-regex-literals": ["error", { disallowRedundantWrapping: true }],
      radix: "error",
      "require-await": "off",
      "vars-on-top": "error",
      yoda: "error",

      // ========================================
      // Errors (from airbnb-base)
      // ========================================
      "for-direction": "error",
      "getter-return": ["error", { allowImplicit: true }],
      "no-async-promise-executor": "error",
      "no-await-in-loop": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": ["error", "always"],
      "no-console": "warn",
      "no-constant-condition": "warn",
      "no-control-regex": "error",
      "no-debugger": "error",
      "no-dupe-args": "error",
      "no-dupe-else-if": "error",
      "no-dupe-keys": "error",
      "no-duplicate-case": "error",
      "no-empty": "error",
      "no-empty-character-class": "error",
      "no-ex-assign": "error",
      "no-extra-boolean-cast": "error",
      "no-func-assign": "error",
      "no-import-assign": "error",
      "no-inner-declarations": "error",
      "no-invalid-regexp": "error",
      "no-irregular-whitespace": "error",
      "no-loss-of-precision": "error",
      "no-misleading-character-class": "error",
      "no-obj-calls": "error",
      "no-promise-executor-return": "error",
      "no-prototype-builtins": "error",
      "no-regex-spaces": "error",
      "no-setter-return": "error",
      "no-sparse-arrays": "error",
      "no-template-curly-in-string": "error",
      "no-unreachable": "error",
      "no-unreachable-loop": ["error", { ignore: [] }],
      "no-unsafe-finally": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": ["error", { disallowArithmeticOperators: true }],
      "no-useless-backreference": "error",
      "use-isnan": "error",
      "valid-typeof": ["error", { requireStringLiterals: true }],

      // ========================================
      // ES6 (from airbnb-base)
      // ========================================
      "arrow-body-style": ["error", "as-needed", { requireReturnForObjectLiteral: false }],
      "constructor-super": "error",
      "no-class-assign": "error",
      "no-confusing-arrow": ["error", { allowParens: true }],
      "no-const-assign": "error",
      "no-dupe-class-members": "error",
      "no-new-symbol": "error",
      "no-restricted-exports": [
        "error",
        {
          restrictedNamedExports: [
            "default", // use `export default` to provide a default export
            "then", // this will cause tons of confusion when your module is dynamically `import()`ed, and will break in most node ESM versions
          ],
        },
      ],
      "no-this-before-super": "error",
      "no-useless-computed-key": "error",
      "no-useless-constructor": "error",
      "no-useless-rename": ["error", { ignoreDestructuring: false, ignoreImport: false, ignoreExport: false }],
      "no-var": "error",
      "object-shorthand": ["error", "always", { ignoreConstructors: false, avoidQuotes: true }],
      "prefer-arrow-callback": ["error", { allowNamedFunctions: false, allowUnboundThis: true }],
      "prefer-const": ["error", { destructuring: "any", ignoreReadBeforeAssign: true }],
      "prefer-destructuring": [
        "error",
        {
          VariableDeclarator: { array: false, object: true },
          AssignmentExpression: { array: true, object: false },
        },
        { enforceForRenamedProperties: false },
      ],
      "prefer-numeric-literals": "error",
      "prefer-rest-params": "error",
      "prefer-spread": "error",
      "prefer-template": "error",
      "require-yield": "error",
      "symbol-description": "error",

      // ========================================
      // Variables (from airbnb-base)
      // ========================================
      "no-delete-var": "error",
      "no-label-var": "error",
      "no-shadow": "error",
      "no-shadow-restricted-names": "error",
      "no-undef": "error",
      "no-undef-init": "error",
      "no-undefined": "off",

      // ========================================
      // Style (from airbnb-base)
      // ========================================
      camelcase: ["error", { properties: "never", ignoreDestructuring: false }],
      "func-names": "warn",
      "lines-between-class-members": ["error", "always", { exceptAfterSingleLine: false }],
      "new-cap": ["error", { newIsCap: true, newIsCapExceptions: [], capIsNew: false, capIsNewExceptions: [] }],
      "no-array-constructor": "error",
      "no-bitwise": "error",
      "no-continue": "error",
      "no-lonely-if": "error",
      "no-multi-assign": ["error"],
      "no-nested-ternary": "error",
      "no-new-object": "error",
      "no-plusplus": "error",
      "no-unneeded-ternary": ["error", { defaultAssignment: false }],
      "one-var": ["error", "never"],
      "operator-assignment": ["error", "always"],
      "prefer-exponentiation-operator": "error",
      "prefer-object-spread": "error",
      "spaced-comment": [
        "error",
        "always",
        {
          line: { exceptions: ["-", "+"], markers: ["=", "!", "/"] },
          block: { exceptions: ["-", "+"], markers: ["=", "!", ":", "::"], balanced: true },
        },
      ],

      // ========================================
      // Import rules (from airbnb-base)
      // ========================================
      "import/export": "error",
      "import/first": "error",
      "import/named": "error",
      "import/newline-after-import": "error",
      "import/no-absolute-path": "error",
      "import/no-amd": "error",
      "import/no-cycle": ["error", { maxDepth: "∞" }],
      "import/no-duplicates": "error",
      "import/no-dynamic-require": "error",
      "import/no-mutable-exports": "error",
      "import/no-named-as-default": "error",
      "import/no-named-as-default-member": "error",
      "import/no-named-default": "error",
      "import/no-relative-packages": "error",
      "import/no-self-import": "error",
      "import/no-unresolved": ["error", { commonjs: true, caseSensitive: true }],
      "import/no-webpack-loader-syntax": "error",

      // ========================================
      // Project-specific overrides (preserved from original config)
      // ========================================
      quotes: ["error", "double"],
      "max-len": ["error", 140],
      "import/extensions": ["error", "never"],
      "import/no-commonjs": ["error", { allowRequire: false, allowPrimitiveModules: false }],
      "import/no-extraneous-dependencies": [
        "error",
        { devDependencies: true, optionalDependencies: true, peerDependencies: true },
      ],
      "import/no-useless-path-segments": ["error", { noUselessIndex: true }],
      "max-classes-per-file": ["error", 10],
      "import/prefer-default-export": "off",
      "object-curly-newline": "off",
      // Replacing airbnb rule with following, to re-enable "ForOfStatement"
      "no-restricted-syntax": ["error", "ForInStatement", "LabeledStatement", "WithStatement"],
      "no-use-before-define": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-use-before-define": ["error", { functions: false, classes: false }],
      "@typescript-eslint/no-unused-vars": ["error"],

      // ========================================
      // Rules relaxed to avoid major codebase changes
      // (original config wasn't effectively enforcing these on TypeScript files)
      // ========================================
      "import/no-cycle": "off", // Codebase has many intentional circular dependencies
      "import/named": "off", // Doesn't work well with TypeScript re-exports and type exports
      "lines-between-class-members": "off", // Style preference - codebase uses compact class definitions
      "no-plusplus": "off", // Common in TypeScript codebases
      "no-continue": "off", // Common in TypeScript codebases
      "no-bitwise": "off", // SDK uses bitwise operations for crypto
      "no-await-in-loop": "off", // Sometimes intentional for sequential operations
      "class-methods-use-this": "off", // Interface conformance often requires this
      "no-shadow": "off", // Many intentional uses in TypeScript
      "consistent-return": "off", // TypeScript handles return type checking
      "no-param-reassign": "off", // Common pattern in SDK
      camelcase: "off", // SDK uses snake_case for blockchain API compatibility
      "no-redeclare": "off", // TypeScript handles this; conflicts with function overloading
    },
  },
  // Apply prettier config last to disable conflicting rules
  prettier,
];
