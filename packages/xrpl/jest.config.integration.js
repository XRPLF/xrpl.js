// Jest configuration for integration tests (local rippled only)
const base = require('../../jest.config.base.js')

module.exports = {
  ...base,
  roots: [...base.roots, '<rootDir>/test'],
  testTimeout: 20000,
  testMatch: [
    '<rootDir>/test/integration/**/*.test.ts',
    '<rootDir>/test/integration/*.test.ts',
  ],
  testPathIgnorePatterns: ['<rootDir>/test/faucet/'],
  displayName: 'xrpl.js',
}
