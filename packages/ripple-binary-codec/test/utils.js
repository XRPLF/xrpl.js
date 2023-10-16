function hexOnly(hex) {
  return hex.replace(/[^a-fA-F0-9]/g, '')
}

function unused() {}

function loadFixture(relativePath) {
  const fn = __dirname + '/fixtures/' + relativePath
  return require(fn)
}

module.exports = {
  hexOnly,
  loadFixture,
  unused,
}
