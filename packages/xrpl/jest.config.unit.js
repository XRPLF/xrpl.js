// Jest configuration for api
const base = require('../../jest.config.base.js')

module.exports = {
  ...base,
  roots: [...base.roots, '<rootDir>/test'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/test/integration',
    '<rootDir>/test/faucet',
    '<rootDir>/test/fixtures',
  ],
  displayName: 'xrpl.js',
}
