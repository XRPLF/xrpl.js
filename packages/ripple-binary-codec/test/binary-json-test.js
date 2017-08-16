const assert = require('assert');
const fixtures = require('./fixtures/codec-fixtures.json');
const {decode, encode, decodeLedgerData} = require('../src');

function json(object) {
  return JSON.stringify(object);
}

describe('ripple-binary-codec', function() {
  function makeSuite(name, entries) {
    describe(name, function() {
      entries.forEach((t, test_n) => {
        it(`${name}[${test_n}] can encode ${json(t.json)} to ${t.binary}`,
        () => {
          assert.equal(t.binary, encode(t.json));
        });
        it(`${name}[${test_n}] can decode ${t.binary} to ${json(t.json)}`,
        () => {
          const decoded = decode(t.binary);
          assert.deepEqual(t.json, decoded);
        });
      });
    });
  }
  makeSuite('transactions', fixtures.transactions);
  makeSuite('accountState', fixtures.accountState);

  describe('ledgerData', function() {
    fixtures.ledgerData.forEach((t, test_n) => {
      it(`ledgerData[${test_n}] can decode ${t.binary} to ${json(t.json)}`,
      () => {
        const decoded = decodeLedgerData(t.binary);
        assert.deepEqual(t.json, decoded);
      });
    });
  })
});
