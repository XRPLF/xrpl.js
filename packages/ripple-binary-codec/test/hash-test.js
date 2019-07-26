const assert = require('assert');
const {Hash160, Hash256, Currency, AccountID} = require('../src/coretypes');

describe('Hash160', function() {
  it('has a static width membmer', function() {
    assert.equal(Hash160.width, 20);
  });
  it('inherited by subclasses', function() {
    assert.equal(AccountID.width, 20);
    assert.equal(Currency.width, 20);
  });
  it('can be compared against another', function() {
    const h1 = Hash160.from('1000000000000000000000000000000000000000');
    const h2 = Hash160.from('2000000000000000000000000000000000000000');
    const h3 = Hash160.from('0000000000000000000000000000000000000003');
    assert(h1.lt(h2));
    assert(h3.lt(h2));
  });
});

describe('Hash256', function() {
  it('has a static width membmer', function() {
    assert.equal(Hash256.width, 32);
  });
  it('has a ZERO_256 member', function() {
    assert.equal(
      Hash256.ZERO_256.toJSON(),
      '0000000000000000000000000000000000000000000000000000000000000000');
  });
  it('supports getting the nibblet values at given positions', function() {
    const h = Hash256.from(
      '1359BD0000000000000000000000000000000000000000000000000000000000');
    assert.equal(h.nibblet(0), 0x1);
    assert.equal(h.nibblet(1), 0x3);
    assert.equal(h.nibblet(2), 0x5);
    assert.equal(h.nibblet(3), 0x9);
    assert.equal(h.nibblet(4), 0x0b);
    assert.equal(h.nibblet(5), 0xd);
  });
});

describe('Currency', function() {
  it('Will have a null iso() for dodgy XRP ', function() {
    const bad = Currency.from('0000000000000000000000005852500000000000');
    assert.equal(bad.iso(), null);
    assert.equal(bad.isNative(), false);
  });
  it('can be constructed from an Array', function() {
    const xrp = Currency.from(new Uint8Array(20));
    assert.equal(xrp.iso(), 'XRP');
  });
  it('throws on invalid reprs', function() {
    assert.throws(() => Currency.from(new Uint8Array(19)));
    assert.throws(() => Currency.from(1));
    assert.throws(() => Currency.from(
      '00000000000000000000000000000000000000m'));
  });
});
