module.exports = {
  root: true,

  parser: '@typescript-eslint/parser', // Make ESLint compatible with TypeScript
  parserOptions: {
    // Enable linting rules with type information from our tsconfig
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json'],

    sourceType: 'module', // Allow the use of imports / ES modules

    ecmaFeatures: {
      impliedStrict: true, // Enable global strict mode
    },
  },

  // Specify global variables that are predefined
  env: {
    browser: true, // Enable browser global variables
    node: true, // Enable node global variables & Node.js scoping
    es2020: true, // Add all ECMAScript 2020 globals and automatically set the ecmaVersion parser option to ES2020
    jest: true, // Add Mocha testing global variables
  },

  plugins: [
    '@typescript-eslint', // Add some TypeScript specific rules, and disable rules covered by the typechecker
    'import', // Add rules that help validate proper imports
    'prettier', // Allows running prettier as an ESLint rule, and reporting differences as individual linting issues
    'jest'
  ],

  extends: [
    // ESLint recommended rules
    'eslint:recommended',

    // Add TypeScript-specific rules, and disable rules covered by typechecker
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',

    // Add rules for import/export syntax
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/typescript',

    // Add rules that specifically require type information using our tsconfig
    'plugin:@typescript-eslint/recommended-requiring-type-checking',

    // Enable Prettier for ESLint --fix, and disable rules that conflict with Prettier
    'prettier/@typescript-eslint',
    'plugin:prettier/recommended',
  ],

  // rules: {
  //   // This rule is about explicitly using `return undefined` when a function returns any non-undefined object.
  //   // However, since we're using TypeScript, it will yell at us if a function is not allowed to return `undefined` in its signature, so we don't need this rule.
  //   "consistent-return": "off",
  // },

  overrides: [
    // Overrides for all test files
    {
      files: 'test/**/*.test.js',
      extends: ["plugin:jest/recommended"],
      rules: {
        // For our Mocha test files, the pattern has been to have unnamed functions
        'func-names': 'off',
        // For some test files, we shadow testing constants with function parameter names
        'no-shadow': 'off',
        // Some of our test files declare helper classes with errors
        'max-classes-per-file': 'off',
        // Test files are in javascript, turn off TypeScript linting.
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/restrict-template-expressions': 'off',
        '@typescript-eslint/no-unsafe-return': 'off',
        '@typescript-eslint/unbound-method': 'off'
      },
    },
    {
      files: '**/*.ts',
      rules: {
        // Allow unused variables in our files when explicitly prepended with `_`.
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_' },
        ],

        '@typescript-eslint/ban-types': 'off',

        // These rules are deprecated, but we have an old config that enables it
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/ban-ts-ignore': 'off',

        // These rules are actually disabled in @xpring-eng/eslint-config-base/loose at the moment
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        "spaced-comment": ["error", "always"],
      },
    },
    {
      files: ['src/XRP/default-xrp-client.ts'],
      rules: {
        // This is actually a good rule to have enabled, but for the XRPClient, we define a helper error message class in the same file
        'max-classes-per-file': 'off',
      },
    },
  ],
}