const { TextDecoder, TextEncoder } = require("util");

const path = require("path");

// The repo compiles with `moduleResolution: "node"`, which ignores package.json
// "exports", so TypeScript cannot find the types of exports-only packages. Map
// each one to its declaration file for ts-jest's type-check. List a package
// before the packages its declarations import: each is resolved from the
// package under test and from the packages already found, so the mapping
// follows wherever npm placed them.
function exportsOnlyTypePaths(packages) {
  const paths = {};
  const searchFrom = [process.cwd(), __dirname];
  for (const pkg of packages) {
    try {
      const entry = require.resolve(pkg, { paths: searchFrom });
      paths[pkg] = [entry.replace(/\.js$/, ".d.ts")];
      searchFrom.push(path.dirname(entry));
    } catch {
      // Not installed for this package; nothing to map.
    }
  }
  return paths;
}

module.exports = {
  roots: ["<rootDir>/src"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          target: "es2020",
          paths: exportsOnlyTypePaths([
            "https-proxy-agent",
            "agent-base",
            "proxy-agent-negotiate",
          ]),
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
