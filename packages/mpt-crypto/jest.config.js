// Jest configuration for mpt-crypto
const base = require('../../jest.config.base.js')

module.exports = {
  ...base,
  roots: [...base.roots, '<rootDir>/test'],
  displayName: 'mpt-crypto',
}
