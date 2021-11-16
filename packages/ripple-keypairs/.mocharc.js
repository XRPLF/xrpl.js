module.exports = {
  opts: false,
  slow: 500,
  timeout: 5000,

  // Required to get proper coverage on TypeScript files
  // transpile-only is required if we use custom types
  require: ['ts-node/register/transpile-only', 'source-map-support/register'],

  // Look for tests in subdirectories
  recursive: true,

  // Check for global variable leaks
  'check-leaks': true,
}
