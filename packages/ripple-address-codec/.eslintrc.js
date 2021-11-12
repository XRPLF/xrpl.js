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
    // ** TODO **
    // all of the below are turned off for now during the migration to a
    // monorepo. They need to actually be addressed!
    // **
    '@typescript-eslint/no-for-in-array': 'off',
    '@typescript-eslint/consistent-type-assertions': 'off',
    '@typescript-eslint/no-unnecessary-condition': 'off',
    '@typescript-eslint/prefer-for-of': 'off',
    '@typescript-eslint/no-require-imports': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-unsafe-assignment': 'off',
    '@typescript-eslint/no-unsafe-member-access': 'off',
    '@typescript-eslint/no-unsafe-call': 'off',
    '@typescript-eslint/no-magic-numbers': 'off',
    '@typescript-eslint/ban-types': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'off',
    '@typescript-eslint/promise-function-async': 'off',
    '@typescript-eslint/prefer-nullish-coalescing': 'off',
    '@typescript-eslint/naming-convention': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/array-type': 'off',
    '@typescript-eslint/restrict-plus-operands': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/check-param-names': 'off',
    'jsdoc/require-throws': 'off',
    'jsdoc/require-hyphen-before-param-description': 'off',
    'jsdoc/require-jsdoc': 'off',
    'jsdoc/require-description-complete-sentence': 'off',
    'jsdoc/require-param': 'off',
    'jsdoc/no-types': 'off',
    'tsdoc/syntax': 'off',
    'import/no-commonjs': 'off',
    'import/order': 'off',
    'prettier/prettier': 'off',
    'no-restricted-syntax': 'off',
    'guard-for-in': 'off',
    'object-shorthand': 'off',
    'no-negated-condition': 'off',
    'no-loop-func': 'off',
    'id-length': 'off',
    'no-inline-comments': 'off',
    'max-lines-per-function': 'off',
    'max-len': 'off',
    'no-nested-ternary': 'off',
    'no-param-reassign': 'off',
    'no-bitwise': 'off',
    'multiline-comment-style': 'off',
    'id-blacklist': 'off',
    'func-names': 'off',
    'max-params': 'off',
    'prefer-template': 'off',
    'no-else-return': 'off',
  },
}
