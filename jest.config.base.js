const { TextDecoder, TextEncoder } = require("util");

module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          target: "es2020",
        },
      },
    ],
    "node_modules/chai/.+\\.js$": "ts-jest",
    "node_modules/(@scure|@noble|https-proxy-agent|agent-base)/.+\\.js$": [
      "ts-jest",
      {
        tsconfig: {
          target: "es2020",
          allowJs: true,
        },
      },
    ],
  },
  transformIgnorePatterns: ["/node_modules/(?!(chai|@scure|@noble|https-proxy-agent|agent-base)/)"],
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
