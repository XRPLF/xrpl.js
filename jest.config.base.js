const { TextDecoder, TextEncoder } = require("util");

module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.ts$": "ts-jest",
    "node_modules/chai/.+\\.js$": "ts-jest",
    "node_modules/@noble/.+\\.js$": "ts-jest",
  },
  transformIgnorePatterns: ["/node_modules/(?!(chai|@noble)/)"],
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
