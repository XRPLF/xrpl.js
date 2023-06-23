// Jest configuration for api
const base = require('../../jest.config.base.js')

module.exports = {
  ...base,
  roots: [...base.roots, '<rootDir>/test'],
  testMatch: [
    '<rootDir>/test/integration/**/*.test.ts',
    '<rootDir>/test/integration/*.test.ts',
  ],
  displayName: 'xrpl.js',
}
