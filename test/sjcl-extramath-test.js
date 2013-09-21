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
    it('0x03', function () {
      var val = new sjcl.bn("03");
      assert.strictEqual(val.testBit(0), 1);
      assert.strictEqual(val.testBit(1), 1);
      assert.strictEqual(val.testBit(2), 0);
    });
    it('0x1000000', function () {
      var val = new sjcl.bn("1000000");
      assert.strictEqual(val.testBit(25), 0);
      assert.strictEqual(val.testBit(24), 1);
      assert.strictEqual(val.testBit(23), 0);
      assert.strictEqual(val.testBit( 1), 0);
      assert.strictEqual(val.testBit( 0), 0);
    });
    it('0xff7fffffff', function () {
      var val = new sjcl.bn("ff7fffffff");
      assert.strictEqual(val.testBit(32), 1);
      assert.strictEqual(val.testBit(31), 0);
      assert.strictEqual(val.testBit(30), 1);
      assert.strictEqual(val.testBit(24), 1);
      assert.strictEqual(val.testBit(23), 1);
      assert.strictEqual(val.testBit(22), 1);
      assert.strictEqual(val.testBit( 1), 1);
      assert.strictEqual(val.testBit( 0), 1);
    });
  });
});

// vim:sw=2:sts=2:ts=8:et
