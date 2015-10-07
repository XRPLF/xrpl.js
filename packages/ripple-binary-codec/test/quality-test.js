'use strict';

const assert = require('assert-diff');
const {encodeQuality, decodeQuality} = require('../src');

describe('Quality encode/decode', function() {
  const bookDirectory =
    '4627DFFCFF8B5A265EDBD8AE8C14A52325DBFEDAF4F5C32E5D06F4C3362FE1D0';
  const expectedQuality = '195796912.5171664';
  it('can decode', function() {
    const decimal = decodeQuality(bookDirectory);
    assert.equal(decimal, expectedQuality);
  });
  it('can encode', function() {
    const hex = encodeQuality(expectedQuality);
    assert.equal(hex, bookDirectory.slice(-16));
  });
});
