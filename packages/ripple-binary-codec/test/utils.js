const fs = require("fs");
const { Buffer } = require('buffer/')

function hexOnly(hex) {
  return hex.replace(/[^a-fA-F0-9]/g, "");
}

function unused() {}

function parseHexOnly(hex) {
  return Buffer.from(hexOnly(hex), "hex");
}

function loadFixture(relativePath) {
  const fn = __dirname + "/fixtures/" + relativePath;
  return require(fn);
}

function loadFixtureText(relativePath) {
  const fn = __dirname + "/fixtures/" + relativePath;
  return fs.readFileSync(fn).toString("utf8");
}

module.exports = {
  hexOnly,
  parseHexOnly,
  loadFixture,
  loadFixtureText,
  unused,
};
