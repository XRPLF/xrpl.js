const intercept = require('intercept-stdout');
const fs = require('fs');
const fsExtra = require('fs-extra');
const assert = require('assert');
const Decimal = require('decimal.js');
const {parseBytes} = require('../src/utils/bytes-utils');

function hexOnly(hex) {
  return hex.replace(/[^a-fA-F0-9]/g, '');
}

function unused() {}

function captureLogsAsync() {
  let log = '';
  const unhook = intercept(txt => {
    log += txt;
    return '';
  });
  return function() {
    unhook();
    return log;
  };
}

function captureLogs(func) {
  const finished = captureLogsAsync();
  try {
    func();
  } catch (e) {
    const log = finished();
    console.error(log);
    throw e;
  }
  return finished();
}

function parseHexOnly(hex, to) {
  return parseBytes(hexOnly(hex), to);
}

function loadFixture(relativePath) {
  const fn = __dirname + '/fixtures/' + relativePath;
  return require(fn);
}

function isBufferOrString(val) {
  return Buffer.isBuffer(val) || (typeof val === 'string');
}

function loadFixtureText(relativePath) {
  const fn = __dirname + '/fixtures/' + relativePath;
  return fs.readFileSync(fn).toString('utf8');
}

function fixturePath(relativePath) {
  return __dirname + '/fixtures/' + relativePath;
}

function prettyJSON(val) {
  return JSON.stringify(val, null, 2);
}

function writeFixture(relativePath, data) {
  const out = isBufferOrString(data) ? data : prettyJSON(data);
  return fsExtra.outputFileSync(fixturePath(relativePath), out);
}

function assertEqualAmountJSON(actual, expected) {
  const typeA = (typeof actual);
  assert(typeA === (typeof expected));
  if (typeA === 'string') {
    assert.equal(actual, expected);
    return;
  }
  assert.equal(actual.currency, expected.currency);
  assert.equal(actual.issuer, expected.issuer);
  assert(actual.value === expected.value ||
            new Decimal(actual.value).equals(
      new Decimal(expected.value)));
}

module.exports = {
  hexOnly,
  parseHexOnly,
  loadFixture,
  loadFixtureText,
  assertEqualAmountJSON,
  writeFixture,
  unused,
  captureLogs,
  captureLogsAsync
};
