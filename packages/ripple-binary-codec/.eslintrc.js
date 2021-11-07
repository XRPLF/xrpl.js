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

  plugins: [],
  extends: ['@xrplf/eslint-config/base'],

  rules: {
    // ** TODO **
    // all of the below are turned off for now during the migration to a
    // monorepo. They need to actually be addressed!
    // **
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/prefer-readonly': 'off',
    '@typescript-eslint/no-parameter-properties': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/unbound-method': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-base-to-string': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/no-magic-numbers': 'off',
    '@typescript-eslint/no-useless-constructor': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/prefer-for-of': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/require-array-sort-compare': 'off',
    '@typescript-eslint/prefer-includes': 'off',
    '@typescript-eslint/dot-notation': 'off',
    '@typescript-eslint/consistent-type-definitions': 'off',
    '@typescript-eslint/no-type-alias': 'off',
    '@typescript-eslint/member-ordering': 'off',
    '@typescript-eslint/prefer-string-starts-ends-with': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/no-extraneous-class': 'off',
    '@typescript-eslint/consistent-type-assertions': 'off',
    'import/unambiguous': 'off',
    'import/extensions': 'off',
    'import/prefer-default-export': 'off',
    'import/no-useless-path-segments': 'off',
    'import/no-unused-modules': 'off',
    'import/no-cycle': 'off',
    'import/order': 'off',
    'import/no-commonjs': 'off',
    'import/newline-after-import': 'off',
    'node/global-require': 'off',
    'consistent-default-export-name/default-import-match-filename': 'off',
    'prettier/prettier': 'off',
    'jsdoc/require-throws': 'off',
    'jsdoc/require-description-complete-sentence': 'off',
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/check-tag-names': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/require-hyphen-before-param-description': 'off',
    'jsdoc/require-description': 'off',
    'jsdoc/require-param': 'off',
    'jsdoc/check-param-names': 'off',
    'jsdoc/newline-after-description': 'off',
    'jsdoc/require-returns-check': 'off',
    'tsdoc/syntax': 'off',
    'eslint-comments/require-description': 'off',
    'eslint-comments/no-unused-disable': 'off',
    'prefer-const': 'off',
    'global-require': 'off',
    'id-length': 'off',
    'no-shadow': 'off',
    'no-bitwise': 'off',
    'spaced-comment': 'off',
    'prefer-template': 'off',
    'prefer-object-spread': 'off',
    'no-inline-comments': 'off',
    'no-plusplus': 'off',
    'new-cap': 'off',
    'id-blacklist': 'off',
    'max-lines-per-function': 'off',
    'require-unicode-regexp': 'off',
    'no-undef-init': 'off',
    'curly': 'off',
    'eqeqeq': 'off',
    'no-console': 'off',
    'max-classes-per-file': 'off',
    'operator-assignment': 'off',
    'class-methods-use-this': 'off',
    'no-else-return': 'off',
    'yoda': 'off',
    'max-depth': 'off',
    'multiline-comment-style': 'off',
    'one-var': 'off',
    'no-negated-condition': 'off',
    'radix': 'off',
    'no-nested-ternary': 'off',
    'no-useless-concat': 'off',
    'object-shorthand': 'off',
    'no-param-reassign': 'off',
  },
}
