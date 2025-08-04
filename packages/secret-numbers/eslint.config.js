const globals = require('globals')
const eslintConfig = require('@patelraj96/eslint-config/base')
const typescriptParser = require('@typescript-eslint/parser')

module.exports = [
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/build/',
      'coverage/',
      'eslint.config.js',
      'jest.config.js',
      'karma.config.js',
      'test/webpack.config.js',
      'webpack.base.config.js',
      'webpack.config.js',
      'samples/',
    ],
  },
  ...eslintConfig,
  {
    languageOptions: {
      sourceType: 'module', // Allow the use of imports / ES modules
      ecmaVersion: 2020,

      parser: typescriptParser, // Make ESLint compatible with TypeScript
      parserOptions: {
        // Enable linting rules with type information from our tsconfig
        tsconfigRootDir: __dirname,
        project: ['./tsconfig.eslint.json'],

        ecmaVersion: 2020,
        ecmaFeatures: {
          impliedStrict: true, // Enable global strict mode
        },

        globals: {
          ...globals.browser,
        },
      },
    },

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
      'jsdoc/check-examples': 'off', // Not implemented in eslint 8
      'tsdoc/syntax': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
    },
  },
]
