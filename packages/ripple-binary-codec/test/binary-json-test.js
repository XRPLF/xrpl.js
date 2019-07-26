const assert = require('assert');
const fixtures = require('./fixtures/codec-fixtures.json');
const {decode, encode, decodeLedgerData} = require('../src');

function json(object) {
  return JSON.stringify(object);
}

function truncateForDisplay(longStr) {
  return longStr.slice(0, 10) + '...' + longStr.slice(-10);
}

describe('ripple-binary-codec', function() {
  function makeSuite(name, entries) {
    describe(name, function() {
      entries.forEach((t, test_n) => {
        // eslint-disable-next-line max-len
        it(`${name}[${test_n}] can encode ${truncateForDisplay(json(t.json))} to ${truncateForDisplay(t.binary)}`,
          () => {
            assert.equal(t.binary, encode(t.json));
          });
        // eslint-disable-next-line max-len
        it(`${name}[${test_n}] can decode ${truncateForDisplay(t.binary)} to ${truncateForDisplay(json(t.json))}`,
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
