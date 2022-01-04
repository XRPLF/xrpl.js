module.exports = {
  root: true,

  parser: '@typescript-eslint/parser', // Make ESLint compatible with TypeScript
  parserOptions: {
    // Enable linting rules with type information from our tsconfig
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],

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
  },

  plugins: [],
  extends: ['@xrplf/eslint-config/base'],

  rules: {
    // This creates a lot of false positives. We should turn this off in our
    // general config.
    'jsdoc/require-description-complete-sentence': 'off',

    // ** TODO **
    // all of the below are turned off for now during the migration to a
    // monorepo. They need to actually be addressed!
    // **
    '@typescript-eslint/no-magic-numbers': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/check-param-names': 'off',
    'jsdoc/require-throws': 'off',
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-param': 'off',
    'tsdoc/syntax': 'off',
  },
}
