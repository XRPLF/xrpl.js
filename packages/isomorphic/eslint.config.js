const globals = require('globals')
const eslintConfig = require('@xrplf/eslint-config/base')
const tseslint = require('typescript-eslint')

module.exports = [
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      'coverage/',
      '.nyc_output/',
      'nyc.config.js',
      '.idea/',
      '**/*.js',
    ],
  },
  ...eslintConfig,
  {
    languageOptions: {
      sourceType: 'module', // Allow the use of imports / ES modules
      ecmaVersion: 2020,
      parser: tseslint.parser, // Make ESLint compatible with TypeScript
      parserOptions: {
        // Enable linting rules with type information from our tsconfig
        tsconfigRootDir: __dirname,
        project: './tsconfig.eslint.json',
        ecmaFeatures: {
          impliedStrict: true, // Enable global strict mode
        },
      },
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
        ...globals.es2020,
      },
    },

    rules: {
      // ** TODO **
      // all of the below are turned off for now during the migration to a
      // monorepo. They need to actually be addressed!
      // **
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      '@typescript-eslint/restrict-plus-operands': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/explicit-member-accessibility': 'off',
      '@typescript-eslint/promise-function-async': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/naming-convention': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',
      'import/no-unused-modules': 'off',
      'import/prefer-default-export': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-description': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/require-description-complete-sentence': 'off',
      'jsdoc/check-tag-names': 'off',
      'jsdoc/check-examples': 'off', // Not implemented in eslint 8
      'jsdoc/no-types': 'off',
      'tsdoc/syntax': 'off',
      'import/order': 'off',
      '@eslint-community/eslint-comments/require-description': 'off',
      'no-shadow': 'off',
      'multiline-comment-style': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
  {
    files: ['test/*.test.ts'],
    // tests are importing through full module name to test in an isomorphic way
    rules: {
      'n/no-extraneous-import': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
]
