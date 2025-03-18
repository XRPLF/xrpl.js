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
    ],
  },
  {
    plugins: {},

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.es2020,
      },

      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',

      parserOptions: {
        tsconfigRootDir: path.dirname(fileURLToPath(import.meta.url)),
        project: ['./tsconfig.eslint.json', './tsconfig.json'],

        ecmaFeatures: {
          impliedStrict: true,
        },
      },
    },
    files: ['**/*.ts'],

    rules: {
      'jsdoc/require-description-complete-sentence': 'off',
      '@typescript-eslint/no-magic-numbers': 'off',
      'jsdoc/require-returns': 'off',
      'jsdoc/check-param-names': 'off',
      'jsdoc/require-throws': 'off',
      'jsdoc/require-jsdoc': 'off',
      'jsdoc/require-param': 'off',
      'jsdoc/check-examples': 'off',
      'tsdoc/syntax': 'off',
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
