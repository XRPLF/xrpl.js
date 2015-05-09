'use strict';
const assert = require('assert');
const Base = require('ripple-lib').Base;
const fixtures = require('./fixtures/base58.json');
const _ = require('lodash');

function digitArray(str) {
  return str.split('').map(function(d) {
    return parseInt(d, 10);
  });
}

function hexToByteArray(hex) {
  const byteArray = [];
  for (let i = 0; i < hex.length / 2; i++) {
    byteArray.push(parseInt(hex.slice(2 * i, 2 * i + 2), 16));
  }
  return byteArray;
}

describe('Base', function() {
  describe('encode_check', function() {
    it('0', function() {
      const encoded = Base.encode_check(0, digitArray('00000000000000000000'));
      assert.strictEqual(encoded, 'rrrrrrrrrrrrrrrrrrrrrhoLvTp');
    });
    it('1', function() {
      const encoded = Base.encode_check(0, digitArray('00000000000000000001'));
      assert.strictEqual(encoded, 'rrrrrrrrrrrrrrrrrrrrBZbvji');
    });
  });
  describe('decode_check', function() {
    it('rrrrrrrrrrrrrrrrrrrrrhoLvTp', function() {
      const decoded = Base.decode_check(0, 'rrrrrrrrrrrrrrrrrrrrrhoLvTp');
      assert(decoded.equals(0));
    });
    it('rrrrrrrrrrrrrrrrrrrrBZbvji', function() {
      const decoded = Base.decode_check(0, 'rrrrrrrrrrrrrrrrrrrrBZbvji');
      assert(decoded.equals(1));
    });
  });
  describe('decode-encode identity', function() {
    it('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh', function() {
      const decoded = Base.decode('rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
      const encoded = Base.encode(decoded);
      assert.strictEqual(encoded, 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh');
    });
  });
  describe('encode', function() {
    it('fixtures', function() {
      for (let i = 0; i < fixtures.ripple.length; i++) {
        const testCase = fixtures.ripple[i];
        const encoded = Base.encode(hexToByteArray(testCase.hex));
        assert.strictEqual(encoded, testCase.string);
      }
    });
  });
  describe('decode', function() {
    it('fixtures', function() {
      for (let i = 0; i < fixtures.ripple.length; i++) {
        const testCase = fixtures.ripple[i];
        const decoded = Base.decode(testCase.string);
        assert.deepEqual(decoded, hexToByteArray(testCase.hex));
      }
    });
  });

  describe('find_prefix', function() {
    it('can find the right version bytes to induce `sEd` for 16 byte payloads',
        function() {
      const version = Base.find_prefix(16, 'sEd');

      // Fill an array of 16 bytes
      const filled = _.fill(Array(16), 0xFF);

      // For all values 0-255, set MSB to value, then encode
      for (let i = 0; i < 0xFF; i++) {
        filled[0] = i;
        const encoded = Base.encode_check(version, filled);
        // Check that sEd prefix was induced
        assert.equal('sEd', encoded.slice(0, 3));
      }

      // This should already be filled with 0xFF, but for simple assuredness
      _.fill(filled, 0xFF);
      // For all values 0-255, set LSB to value, then encode
      for (let i = 0; i < 0xFF; i++) {
        filled[filled.length - 1] = i;
        const encoded = Base.encode_check(version, filled);
        assert.equal('sEd', encoded.slice(0, 3));
      }

      // The canonical version for sed25519 prefixes
      assert(_.isEqual(version, Base.VER_ED25519_SEED));
    });
  });
});
