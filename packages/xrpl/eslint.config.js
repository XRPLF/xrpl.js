const globals = require('globals')
const eslintConfig = require('@xrplf/eslint-config/base')
const tseslint = require('typescript-eslint')

module.exports = [
  {
    ignores: [
      '**/node_modules/',
      '**/dist/',
      '**/build/',
      'coverage/',
      '**/*.js',
      'typedoc.mts',
      'tools/',
    ],
  },
  ...eslintConfig,
  {
    languageOptions: {
      sourceType: 'module', // Allow the use of imports / ES modules
      ecmaVersion: 2020,

      // Make ESLint compatible with TypeScript
      parser: tseslint.parser,
      parserOptions: {
        // Enable linting rules with type information from our tsconfig
        tsconfigRootDir: __dirname,
        project: [
          './tsconfig.eslint.json',
          '../ripple-binary-codec/tsconfig.eslint.json',
          '../ripple-address-codec/tsconfig.eslint.json',
          '../ripple-keypairs/tsconfig.eslint.json',
        ],
        ecmaFeatures: {
          impliedStrict: true, // Enable global strict mode
        },
      },
      globals: {
        ...globals.jest,
        ...globals.node,
        ...globals.es2020,
      },
    },

    rules: {
      'multiline-comment-style': 'off',
      // Disabled until https://github.com/import-js/eslint-plugin-import/pull/2305 is resolved to
      // accomodate this change https://github.com/XRPLF/xrpl.js/pull/2133
      'import/no-unused-modules': 'off',
      // Certain rippled APIs require snake_case naming
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase', 'snake_case'],
        },
      ],
      'max-lines-per-function': [
        'warn',
        { max: 40, skipBlankLines: true, skipComments: true },
      ],
      'max-statements': ['warn', 25],
      // exception for lodash
      'id-length': ['error', { exceptions: ['_'] }],

      // no-shadow has false-positives for enum, @typescript-eslint version fixes that
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': ['error'],
      'jsdoc/check-examples': 'off',
      // We want to use certain fields like "@interface" to make join types treated as interfaces.
      'jsdoc/check-tag-names': 'off',
      'jsdoc/require-hyphen-before-param-description': 'off',

      'tsdoc/syntax': 'off',
      'jsdoc/require-description-complete-sentence': 'off',
      'import/prefer-default-export': 'off',
      'max-depth': ['warn', 3],
      'n/no-unsupported-features/node-builtins': 'off',
      'import/no-named-as-default': 'off',
      'n/no-unpublished-import': 'off',
    },
  },
  {
    files: ['test/**/*.ts'],
    rules: {
      /*
       * Because this project is managed by lerna, dev dependencies are
       * hoisted and do not appear in the package.json.
       */
      'import/no-extraneous-dependencies': 'off',
      'n/no-extraneous-import': 'off',

      // We have lots of magic numbers in tests
      '@typescript-eslint/no-magic-numbers': 'off',

      // We have files with a lot of tests
      'max-lines-per-function': 'off',
      'max-lines': 'off',

      // We need to test things without type guards sometimes
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/consistent-type-assertions': 'off',

      // We need to mess with internal things to generate certain testing situations
      '@typescript-eslint/no-unsafe-member-access': 'off',

      // Tests are already in 2 callbacks, so max 3 is pretty restrictive
      'max-nested-callbacks': 'off',

      // messes with fixtures
      'consistent-default-export-name/default-import-match-filename': 'off',
    },
  },
  {
    files: ['test/client/*.ts'],
  },
  {
    files: ['test/models/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    files: ['src/models/**/*.ts'],
    rules: {
      complexity: ['off'],
    },
  },
]
