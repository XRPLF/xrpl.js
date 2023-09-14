module.exports = {
  root: true,

  // Make ESLint compatible with TypeScript
  parser: '@typescript-eslint/parser',
  parserOptions: {
    // Enable linting rules with type information from our tsconfig
    tsconfigRootDir: __dirname,
    project: [
      './tsconfig.eslint.json',
      '../ripple-binary-codec/tsconfig.eslint.json',
      '../ripple-address-codec/tsconfig.eslint.json',
      '../ripple-keypairs/tsconfig.eslint.json',
    ],

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
    jest: true,
  },

  plugins: [],
  extends: ['@xrplf/eslint-config/base'],
  rules: {
    'multiline-comment-style': 'off',
    // Disabled until https://github.com/import-js/eslint-plugin-import/pull/2305 is resolved to
    // accomodate this change https://github.com/XRPLF/xrpl.js/pull/2133
    'import/no-unused-modules': 'off',
    'eslint-comments/no-unused-disable': 'off',
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
      files: ['snippets/src/*.ts'],
      rules: {
        'import/no-unused-modules': 'off',
        // Each file has a particular flow.
        'max-lines-per-function': 'off',
        'max-statements': 'off',
        // Snippets have logs on console to better understand the working.
        'no-console': 'off',
        'import/no-extraneous-dependencies': 'off',
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
        'node/no-extraneous-import': 'off',

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
