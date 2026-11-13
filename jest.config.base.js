const { TextDecoder, TextEncoder } = require("util");

module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          target: "es2020",
          // Resolve dependencies through package.json "exports" so exports-only ESM
          // packages (e.g. https-proxy-agent v9) type-check in tests.
          module: "node20",
          moduleResolution: "node16",
        },
      },
    ],
    "node_modules/chai/.+\\.js$": "ts-jest",
    "node_modules/(@scure|@noble|https-proxy-agent|agent-base|proxy-agent-negotiate)/.+\\.js$": [
      "ts-jest",
      {
        tsconfig: {
          target: "es2020",
          allowJs: true,
        },
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!(chai|@scure|@noble|https-proxy-agent|agent-base|proxy-agent-negotiate)/)"],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  collectCoverage: true,
  verbose: true,
  testEnvironment: "node",
  coverageReporters: [["text", { skipFull: true }], "text-summary"],
  globals: {
    TextDecoder: TextDecoder,
    TextEncoder: TextEncoder,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug,
  },
};
