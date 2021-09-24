module.exports = {
  root: true,

  // Make ESLint compatible with TypeScript
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Enable linting rules with type information from our tsconfig
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.eslint.json'],

    // Allow the use of imports / ES modules
    sourceType: 'module',

    ecmaFeatures: {
      // Enable global strict mode
      impliedStrict: true,
    },
  },

  // Specify global variables that are predefined
  env: {
    // Enable node global variables & Node.js scoping
    node: true,
    // Add all ECMAScript 2020 globals and automatically set the ecmaVersion parser option to ES2020
    es2020: true,
  },

  plugins: [],
  extends: ['@xrplf/eslint-config/base', 'plugin:mocha/recommended'],
  rules: {
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
  },
  overrides: [
    {
      files: ['.eslintrc.js'],
      rules: {
        'import/no-unused-modules': 'off',
        '@typescript-eslint/no-magic-numbers': 'off',
      },
    },
    {
      // TODO: remove when snippets are written
      files: ['snippets/src/*.ts'],
      rules: {
        'max-len': 'off',
        'import/unambiguous': 'off',
        'import/no-unused-modules': 'off',
      },
    },
    {
      files: ['test/**/*.ts'],
      rules: {
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

        // We need to be able to import xrpl-local
        'node/no-extraneous-import': [
          'error',
          {
            allowModules: ['xrpl-local'],
          },
        ],

        // Tests are already in 2 callbacks, so max 3 is pretty restrictive
        'max-nested-callbacks': 'off',

        // setup/teardown client is easier to do in before/after, even if there is only one testcase
        'mocha/no-hooks-for-single-case': 'off',
      },
    },
    {
      files: ['test/client/*.ts'],
      rules: {
        // Rule does not work with dynamically generated tests.
        'mocha/no-setup-in-describe': 'off',
      },
    },
    {
      files: ['test/models/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
      },
    },
    {
      files: ['.eslintrc.js', 'jest.config.js'],
      rules: {
        // Removed no-commonjs requirement as eslint must be in common js format
        'import/no-commonjs': 'off',

        // Removed this as eslint prevents us from doing this differently
        'import/unambiguous': 'off',

        // Javascript files have CommonJS exports
        'import/no-unused-modules': 'off',
      },
    },
  ],
}
