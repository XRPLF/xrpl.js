import globals from 'globals'
import tsParser from '@typescript-eslint/parser'
import path from 'path'
import { fileURLToPath } from 'url'
import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    ignores: [
      '**/node_modules',
      '**/dist',
      '**/coverage',
      '**/.nyc_output',
      '**/nyc.config.js',
      '**/.idea',
    ],
  },
  {
    plugins: {},

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.jest,
        ...globals.es2020,
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
        project: ['./tsconfig.json', './tsconfig.eslint.json'],

        ecmaFeatures: {
          impliedStrict: true,
        },
      },
    },

    files: ['**/*.ts'],

    rules: {
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      '@typescript-eslint/ban-types': 'off',
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
      'jsdoc/check-examples': 'off',
      'jsdoc/no-types': 'off',
      'tsdoc/syntax': 'off',
      'import/order': 'off',
      'eslint-comments/require-description': 'off',
      'no-shadow': 'off',
      'multiline-comment-style': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    files: ['test/*.test.ts'],

    rules: {
      'node/no-extraneous-import': 'off',
      'import/no-extraneous-dependencies': 'off',
    },
  },
]
