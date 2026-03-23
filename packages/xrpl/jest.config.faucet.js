// Jest configuration for faucet tests
const base = require('../../jest.config.base.js')

module.exports = {
  ...base,
  roots: [...base.roots, '<rootDir>/test'],
  testTimeout: 60000, // Longer timeout for faucet tests
  testMatch: [
    '<rootDir>/test/faucet/**/*.test.ts',
    '<rootDir>/test/faucet/*.test.ts',
  ],
  displayName: 'xrpl.js-faucet',
}
