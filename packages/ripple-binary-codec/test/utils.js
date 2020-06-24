const fs = require('fs')
const { parseBytes } = require('../dist/utils/bytes-utils')

function hexOnly (hex) {
  return hex.replace(/[^a-fA-F0-9]/g, '')
}

function unused () {}

function parseHexOnly (hex, to) {
  return parseBytes(hexOnly(hex), to)
}

function loadFixture (relativePath) {
  const fn = __dirname + '/fixtures/' + relativePath
  return require(fn)
}

function loadFixtureText (relativePath) {
  const fn = __dirname + '/fixtures/' + relativePath
  return fs.readFileSync(fn).toString('utf8')
}

module.exports = {
  hexOnly,
  parseHexOnly,
  loadFixture,
  loadFixtureText,
  unused
}
