// Jest configuration for api
const base = require('../../jest.config.base.js')

module.exports = {
  ...base,
  roots: [...base.roots, '<rootDir>/test'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/(?!lodash-es)',
    '<rootDir>/test/integration',
    '<rootDir>/test/fixtures',
  ],
  displayName: 'xrpl.js',
}
