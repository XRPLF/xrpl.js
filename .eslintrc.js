module.exports = {
  root: true,

  // Make ESLint compatible with TypeScript
  parser: "@typescript-eslint/parser",
  parserOptions: {
    // Enable linting rules with type information from our tsconfig
    tsconfigRootDir: __dirname,
    project: ["./tsconfig.eslint.json"],

    // Allow the use of imports / ES modules
    sourceType: "module",

    ecmaFeatures: {
      // Enable global strict mode
      impliedStrict: true,
    },
  },

  // Specify global variables that are predefined
  env: {
    node: true, // Enable node global variables & Node.js scoping
    es2020: true, // Add all ECMAScript 2020 globals and automatically set the ecmaVersion parser option to ES2020
  },

  plugins: [],
  extends: ["@xrplf/eslint-config/base", "plugin:mocha/recommended"],
  rules: {
    // Certain rippled APIs require snake_case naming
    "@typescript-eslint/naming-convention": [
      "error",
      {
        selector: "interface",
        format: ["PascalCase"],
      },
      {
        selector: "interface",
        format: ["snake_case"],
      },
    ],

    // Ignore type imports when counting dependencies.
    "import/max-dependencies": [
      "error",
      {
        max: 5,
        ignoreTypeImports: true,
      },
    ],
    // Removes comments and blank lines from the max-line rules
    "max-lines-per-function": [
      "warn",
      {
        max: 50,
        skipBlankLines: true,
        skipComments: true,
      },
    ],
    "max-lines": [
      "warn",
      {
        max: 250,
        skipBlankLines: true,
        skipComments: true,
      },
    ],
  },
  overrides: [
    {
      files: ["test/**/*.ts"],
      rules: {
        // Removed the max for test files and test helper files, since tests usually need to import more things
        "import/max-dependencies": "off",

        // describe blocks count as a function in Mocha tests, and can be insanely long
        "max-lines-per-function": "off",

        // Tests can be very long turns off max-line count
        "max-lines": "off",

        // We have lots of statements in tests
        "max-statements": "off",

        // We have lots of magic numbers in tests
        "no-magic-number": "off",
        "@typescript-eslint/no-magic-numbers": "off",

        // We need to test things without type guards sometimes
        "@typescript-eslint/no-unsafe-assignment": "off",

        // We need to mess with internal things to generate certain testing situations
        "@typescript-eslint/no-unsafe-member-access": "off",

        // We need to be able to import xrpl-local
        "node/no-extraneous-import": [
          "error",
          {
            allowModules: ["xrpl-local"],
          },
        ],
      },
    },
    {
      files: ["test/models/*.ts"],
      rules: {
        "@typescript-eslint/consistent-type-assertions": "off",
        "@typescript-eslint/no-explicit-any": "off",
      },
    },
    {
      files: [".eslintrc.js", "jest.config.js"],
      rules: {
        // Removed no-commonjs requirement as eslint must be in common js format
        "import/no-commonjs": "off",

        // Removed this as eslint prevents us from doing this differently
        "import/unambiguous": "off",
      },
    },
  ],
};
