'use strict';
var assert = require('assert');
var Base = require('ripple-lib').Base;
var fixtures = require('./fixtures/base58.json');

function digitArray(str) {
  return str.split('').map(function(d) {
    return parseInt(d, 10);
  });
}

function hexToByteArray(hex) {
  var byteArray = [];
  for (var i = 0; i < hex.length / 2; i++) {
    byteArray.push(parseInt(hex.slice(2 * i, 2 * i + 2), 16));
  }
  return byteArray;
}

describe('Base', function() {
  describe('encode_check', function() {
    it('0', function () {
      var encoded = Base.encode_check(0, digitArray('00000000000000000000'));
      assert.strictEqual(encoded, 'rrrrrrrrrrrrrrrrrrrrrhoLvTp');
    });
    it('1', function () {
      var encoded = Base.encode_check(0, digitArray('00000000000000000001'));
      assert.strictEqual(encoded, 'rrrrrrrrrrrrrrrrrrrrBZbvji');
    });
  });
  describe('decode_check', function() {
    it('rrrrrrrrrrrrrrrrrrrrrhoLvTp', function() {
      var decoded = Base.decode_check(0, 'rrrrrrrrrrrrrrrrrrrrrhoLvTp');
      assert(decoded.equals(0));
    });
    it('rrrrrrrrrrrrrrrrrrrrBZbvji', function() {
      var decoded = Base.decode_check(0, 'rrrrrrrrrrrrrrrrrrrrBZbvji');
      assert(decoded.equals(1));
    });
  });
  describe('decode-encode identity', function() {
    it('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function() {
      var decoded = Base.decode('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
      var encoded = Base.encode(decoded);
      assert.strictEqual(encoded, 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
    });
  });
  describe('encode', function() {
    it('fixtures', function() {
      for (var i = 0; i < fixtures.ripple.length; i++) {
        var testCase = fixtures.ripple[i];
        var encoded = Base.encode(hexToByteArray(testCase.hex));
        assert.strictEqual(encoded, testCase.string);
      }
    });
  });
  describe('decode', function() {
    it('fixtures', function() {
      for (var i = 0; i < fixtures.ripple.length; i++) {
        var testCase = fixtures.ripple[i];
        var decoded = Base.decode(testCase.string);
        assert.deepEqual(decoded, hexToByteArray(testCase.hex));
      }
    });
  });
});
