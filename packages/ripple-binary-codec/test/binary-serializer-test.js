/* eslint-disable func-style */

'use strict';

const BN = require('bn.js');
const assert = require('assert-diff');
const lib = require('../src/coretypes');
const {binary: {makeParser, BytesList, BinarySerializer}} = lib;
const {UInt8, UInt16, UInt32, UInt64, STObject} = lib;
const {loadFixture} = require('./utils');
const fixtures = loadFixture('data-driven-tests.json');

function bytesListTest() {
  const list = new BytesList().put([0]).put([2, 3]).put([4, 5]);
  it('is an Array<Uint8Array>', function() {
    assert(Array.isArray(list.arrays));
    assert(list.arrays[0] instanceof Uint8Array);
  });
  it('keeps track of the length itself', function() {
    assert.equal(list.length, 5);
  });
  it('can join all arrays into one via toBytes', function() {
    const joined = list.toBytes();
    assert(joined.length, 5);
    assert.deepEqual(joined, [0, 2, 3, 4, 5]);
  });
}

function assertRecycles(blob) {
  const parser = makeParser(blob);
  const so = parser.readType(STObject);
  const out = new BytesList();
  so.toBytesSink(out);
  const hex = out.toHex();
  assert.equal(hex, blob);
  assert.notEqual(hex + ':', blob);
}

function nestedObjectTests() {
  fixtures.whole_objects.forEach((f, i) => {
    it(`whole_objects[${i}]: can parse blob and dump out same blob`,
    /*                                              */ () => {
      assertRecycles(f.blob_with_no_signing);
    });
  });
}

function UIntTest() {
  function check(type, n, expected) {
    it(`Uint${type.width * 8} serializes ${n} as ${expected}`, function() {
      const bl = new BytesList();
      const serializer = new BinarySerializer(bl);
      if (expected === 'throws') {
        assert.throws(() => serializer.writeType(type, n));
        return;
      }
      serializer.writeType(type, n);
      assert.deepEqual(bl.toBytes(), expected);
    });
  }

  check(UInt8, 5, [5]);
  check(UInt16, 5, [0, 5]);
  check(UInt32, 5, [0, 0, 0, 5]);
  check(UInt32, 0xFFFFFFFF, [255, 255, 255, 255]);
  check(UInt8, 0xFEFFFFFF, 'throws');
  check(UInt16, 0xFEFFFFFF, 'throws');
  check(UInt16, 0xFEFFFFFF, 'throws');
  check(UInt64, 0xFEFFFFFF, [0, 0, 0, 0, 254, 255, 255, 255]);
  check(UInt64, -1, 'throws');
  check(UInt64, 0, [0, 0, 0, 0, 0, 0, 0, 0]);
  check(UInt64, 1, [0, 0, 0, 0, 0, 0, 0, 1]);
  check(UInt64, new BN(1), [0, 0, 0, 0, 0, 0, 0, 1]);
}


function parseLedger4320278() {
  it(`can parse object`, (done) => {
    this.timeout(30e3);
    const json = loadFixture('as-ledger-4320278.json');
    json.forEach((e) => {
      assertRecycles(e.binary);
    });
    done();
  });
}

describe('Binary Serialization', function() {
  describe.skip('parseLedger4320278', parseLedger4320278);
  describe('nestedObjectTests', nestedObjectTests);
  describe('UIntTest', UIntTest);
  describe('BytesList', bytesListTest);
});
