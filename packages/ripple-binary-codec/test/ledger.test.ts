import ledgerFull38129 from './fixtures/ledger-full-38129.json'
import ledgerFull40000 from './fixtures/ledger-full-40000.json'

const {
  transactionTreeHash,
  ledgerHash,
  accountStateHash,
} = require('../src/ledger-hashes')

describe('Ledger Hashes', function () {
  function testFactory(
    ledgerIndex: number,
    ledger: typeof ledgerFull38129 | typeof ledgerFull40000,
  ) {
    describe(`can calculate hashes for ledger ${ledgerIndex}`, function () {
      it('computes correct account state hash', function () {
        expect(accountStateHash(ledger.accountState).toHex()).toBe(
          ledger.account_hash,
        )
      })
      it('computes correct transaction tree hash', function () {
        expect(transactionTreeHash(ledger.transactions).toHex()).toBe(
          ledger.transaction_hash,
        )
      })
      it('computes correct ledger header hash', function () {
        expect(ledgerHash(ledger).toHex()).toBe(ledger.hash)
      })
    })
  }
  testFactory(38129, ledgerFull38129)
  testFactory(40000, ledgerFull40000)
})
