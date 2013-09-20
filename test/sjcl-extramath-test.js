var assert = require('assert');
var utils  = require('./testutils');
var sjcl   = require('../build/sjcl');

describe('SJCL Extramath', function() {
  describe('setBitM', function() {
    it('0x0f set bit 4 => 0x1f', function () {
      var val = new sjcl.bn("0f");
      val.setBitM(4);
      assert.strictEqual(val.toString(), '0x1f');
    });
    it('0x0f set bit 23 => 0x80000f', function () {
      var val = new sjcl.bn("0f");
      val.setBitM(23);
      assert.strictEqual(val.toString(), '0x80000f');
    });
    it('0x0f set bit 24 => 0x100000f', function () {
      var val = new sjcl.bn("0f");
      val.setBitM(24);
      assert.strictEqual(val.toString(), '0x100000f');
    });
  });
  describe('testBit', function() {
    it('0x03 test bit 0 => 1', function () {
      var val = new sjcl.bn("03");
      assert.strictEqual(val.testBit(0), 1);
    });
    it('0x03 test bit 1 => 1', function () {
      var val = new sjcl.bn("03");
      assert.strictEqual(val.testBit(1), 1);
    });
    it('0x03 test bit 2 => 0', function () {
      var val = new sjcl.bn("03");
      assert.strictEqual(val.testBit(2), 0);
    });
  });
});

// vim:sw=2:sts=2:ts=8:et
