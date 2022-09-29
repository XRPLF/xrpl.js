// Jest configuration for api
const base = require('../../jest.config.base.js')

module.exports = {
  ...base,
  roots: [...base.roots, '<rootDir>/test'],
  name: 'ripple-binary-codec',
  displayName: 'ripple-binary-codec',
}
