module.exports = {
  root: true,

  parser: '@typescript-eslint/parser', // Make ESLint compatible with TypeScript
  parserOptions: {
    // Enable linting rules with type information from our tsconfig
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './tsconfig.eslint.json'],

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
    jest: true, // Add Jest testing global variables
  },

  plugins: [],
  extends: ['@xrplf/eslint-config/base'],

  rules: {
    // ** TODO **
    // all of the below are turned off for now during the migration to a
    // monorepo. They need to actually be addressed!
    // **
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-magic-numbers': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-description': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/require-description-complete-sentence': 'off',
    'jsdoc/check-tag-names': 'off',
    'jsdoc/no-types': 'off',
    'tsdoc/syntax': 'off',
    'import/order': 'off',
    'eslint-comments/require-description': 'off',
    'no-shadow': 'off',
    'multiline-comment-style': 'off',
    '@typescript-eslint/no-require-imports': 'off',
  },
}
