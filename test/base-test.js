'use strict';
var assert = require('assert');
var Base = require('ripple-lib').Base;

function digitArray(str) {
  return str.split('').map(function(d) {
    return parseInt(d, 10);
  });
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
});
