const assert = require('assert');
const {loadFixture} = require('./utils');
const ledgerHashes = require('../src/ledger-hashes');
const {transactionTreeHash, ledgerHash, accountStateHash} = ledgerHashes;

describe('Ledger Hashes', function() {
  function testFactory(ledgerFixture) {
    describe(`can calculate hashes for ${ledgerFixture}`, function() {
      const ledger = loadFixture(ledgerFixture);
      it('computes correct account state hash', function() {
        assert.equal(accountStateHash(ledger.accountState).toHex(),
                     ledger.account_hash);
      });
      it('computes correct transaction tree hash', function() {
        assert.equal(transactionTreeHash(ledger.transactions).toHex(),
                     ledger.transaction_hash);
      });
      it('computes correct ledger header hash', function() {
        assert.equal(ledgerHash(ledger).toHex(), ledger.hash);
      });
    });
  }
  testFactory('ledger-full-40000.json');
  testFactory('ledger-full-38129.json');
});

