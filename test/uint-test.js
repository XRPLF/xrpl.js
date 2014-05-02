var assert  = require('assert');
var utils   = require('./testutils');
var UInt128 = utils.load_module('uint128').UInt128;
var config  = require('./testutils').get_config();

describe('UInt', function() {
  describe('128', function() {
    describe('#parse_number', function () {
      it('should create 00000000000000000000000000000000 when called with 0', function () {
        var val = UInt128.from_number(0);
        assert.strictEqual(val.to_hex(), '00000000000000000000000000000000');
      });
      it('should create 00000000000000000000000000000001 when called with 1', function () {
        var val = UInt128.from_number(0);
        assert.strictEqual(val.to_hex(), '00000000000000000000000000000000');
      });
      it('should create 000000000000000000000000FFFFFFFF when called with 0xFFFFFFFF', function () {
        var val = UInt128.from_number(0xFFFFFFFF);
        assert.strictEqual(val.to_hex(), '000000000000000000000000FFFFFFFF');
      });
    });
  });
});

// vim:sw=2:sts=2:ts=8:et
