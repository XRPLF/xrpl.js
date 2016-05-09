const assert = require('assert');
const bytesUtils = require('../src/utils/bytes-utils');
const {slice, compareBytes, parseBytes, bytesToHex} = bytesUtils;

describe('bytes-utils', function() {
  describe('parseBytes', function() {
    it('can decode hex', function() {
      assert.deepEqual(parseBytes('0012'), [0x00, 0x12]);
      assert.deepEqual(parseBytes('0012'), [0x00, 0x12]);
      assert.deepEqual(parseBytes('00AA'), [0x00, 0xaa]);
    });
    it('can decode hex to a Uint8Array', function() {
      const result = parseBytes('0012', Uint8Array);
      assert(result instanceof Uint8Array);
      assert.deepEqual(result, [0x00, 0x12]);
    });
    it('can convert a list to a Uint8Array', function() {
      const result = parseBytes([0x00, 0x12], Uint8Array);
      assert(result instanceof Uint8Array);
      assert.deepEqual(result, [0x00, 0x12]);
    });
    it('can decode hex to a Buffer', function() {
      const result = parseBytes('0012', Buffer);
      assert(result instanceof Buffer);
      assert.deepEqual(result.toJSON().data, [0x00, 0x12]);
    });
  });

  describe('bytesToHex', function() {
    it('can encode an array as hex', function() {
      assert.deepEqual(bytesToHex([0x00, 0xaa]), '00AA');
      assert.deepEqual(bytesToHex([0xaa]), 'AA');
    });
    it('can encode Uint8Array as hex', function() {
      assert.deepEqual(bytesToHex(new Uint8Array([0x00, 0xaa])), '00AA');
      assert.deepEqual(bytesToHex(new Uint8Array([0xaa])), 'AA');
    });
  });

  describe('compareBytes', function() {
    it('compares the bytes sequence as big endian number', function() {
      assert.equal(compareBytes([0, 1, 2], [1, 2, 3]), -1);
    });
    it('throws when the bytes sequences are of unlike length', function() {
      assert.throws(() => compareBytes([0, 1], [1]));
    });
  });

  describe('slice', function() {
    const val = [1, 2, 3, 4, 5];
    it('creates a slice of the same type as first arg', function() {
      assert(Array.isArray(slice(val)));
    });
    it('the 2nd arg is the start position [2:]', function() {
      assert.deepEqual(val.slice(2), [3, 4, 5]);
      assert.deepEqual(slice(val, 2), [3, 4, 5]);
    });
    it('the 3rd arg is the end position [2:4]', function() {
      assert.deepEqual(slice(val, 2, 4), [3, 4]);
    });
    it('can slice using negative numbers [-3:]', function() {
      assert.deepEqual(slice(val, -3), [3, 4, 5]);
    });
    it('can slice using negative numbers [-3:-1]', function() {
      assert.deepEqual(slice(val, -3, -1), [3, 4]);
    });
    it('the 4th arg is the output class type', function() {
      assert.deepEqual(slice(val, 2, 4, Buffer).toJSON().data, [3, 4]);
      assert.deepEqual(slice(val, 2, 4, Uint8Array), [3, 4]);
    });
  });
});
