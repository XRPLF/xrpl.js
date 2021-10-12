import { assert } from 'chai'

import { ValidationError, XrplError } from 'xrpl-local'

import { hashes } from '../../src/utils'
import requests from '../fixtures/requests'
import responses from '../fixtures/responses'

const { hashLedger } = hashes
const { hashLedger: REQUEST_FIXTURES } = requests

describe('hashLedger', function () {
  let ledger
  beforeEach(function () {
    ledger = JSON.parse(JSON.stringify(responses.getLedger.full))

    if (ledger.rawState != null) {
      ledger.accountState = JSON.parse(ledger.rawState)
    }
  })

  it('given corrupt data - should fail', function () {
    ledger.transactions[0] = JSON.parse(
      '{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Amount":"12000000000","Destination":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Fee":"10","Flags":0,"Sequence":62,"SigningPubKey":"034AADB09CFF4A4804073701EC53C3510CDC95917C2BB0150FB742D0C66E6CEE9E","TransactionType":"Payment","TxnSignature":"3045022022EB32AECEF7C644C891C19F87966DF9C62B1F34BABA6BE774325E4BB8E2DD62022100A51437898C28C2B297112DF8131F2BB39EA5FE613487DDD611525F1796264639","hash":"3B1A4E1C9BB6A7208EB146BCDB86ECEA6068ED01466D933528CA2B4C64F753EF","metaData":{"AffectedNodes":[{"CreatedNode":{"LedgerEntryType":"AccountRoot","LedgerIndex":"4C6ACBD635B0F07101F7FA25871B0925F8836155462152172755845CE691C49E","NewFields":{"Account":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Balance":"10000000000","Sequence":1}}},{"ModifiedNode":{"FinalFields":{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Balance":"981481999380","Flags":0,"OwnerCount":0,"Sequence":63},"LedgerEntryType":"AccountRoot","LedgerIndex":"B33FDD5CF3445E1A7F2BE9B06336BEBD73A5E3EE885D3EF93F7E3E2992E46F1A","PreviousFields":{"Balance":"991481999390","Sequence":62},"PreviousTxnID":"2485FDC606352F1B0785DA5DE96FB9DBAF43EB60ECBB01B7F6FA970F512CDA5F","PreviousTxnLgrSeq":31317}}],"TransactionIndex":0,"TransactionResult":"tesSUCCESS"},"ledger_index":38129}',
    )

    ledger.parent_close_time = ledger.close_time
    let hash: string
    try {
      hash = hashLedger(ledger, { computeTreeHashes: true })
    } catch (error) {
      if (!(error instanceof XrplError)) {
        throw error
      }

      assert(error instanceof ValidationError)
      if (error instanceof ValidationError) {
        assert.strictEqual(
          error.message,
          'transactionHash in header does not match computed hash of transactions',
        )
        assert.deepStrictEqual(error.data, {
          transactionHashInHeader:
            'DB83BF807416C5B3499A73130F843CF615AB8E797D79FE7D330ADF1BFA93951A',
          computedHashOfTransactions:
            'EAA1ADF4D627339450F0E95EA88B7069186DD64230BAEBDCF3EEC4D616A9FC68',
        })
      }
      return
    }
    assert(
      false,
      `Should throw ValidationError instead of producing hash: ${hash}`,
    )
  })

  it('given ledger without raw transactions - should throw', function () {
    delete ledger.transactions
    ledger.parentCloseTime = ledger.closeTime

    assert.throws(
      () => hashLedger(ledger, { computeTreeHashes: true }),
      ValidationError,
      'transactions is missing from the ledger',
    )
  })

  it('given ledger without state or transactions - only compute ledger hash', function () {
    ledger.transactions[0] = JSON.parse(
      '{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Amount":"10000000000","Destination":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Fee":"10","Flags":0,"Sequence":62,"SigningPubKey":"034AADB09CFF4A4804073701EC53C3510CDC95917C2BB0150FB742D0C66E6CEE9E","TransactionType":"Payment","TxnSignature":"3045022022EB32AECEF7C644C891C19F87966DF9C62B1F34BABA6BE774325E4BB8E2DD62022100A51437898C28C2B297112DF8131F2BB39EA5FE613487DDD611525F1796264639","hash":"3B1A4E1C9BB6A7208EB146BCDB86ECEA6068ED01466D933528CA2B4C64F753EF","metaData":{"AffectedNodes":[{"CreatedNode":{"LedgerEntryType":"AccountRoot","LedgerIndex":"4C6ACBD635B0F07101F7FA25871B0925F8836155462152172755845CE691C49E","NewFields":{"Account":"rLQBHVhFnaC5gLEkgr6HgBJJ3bgeZHg9cj","Balance":"10000000000","Sequence":1}}},{"ModifiedNode":{"FinalFields":{"Account":"r3kmLJN5D28dHuH8vZNUZpMC43pEHpaocV","Balance":"981481999380","Flags":0,"OwnerCount":0,"Sequence":63},"LedgerEntryType":"AccountRoot","LedgerIndex":"B33FDD5CF3445E1A7F2BE9B06336BEBD73A5E3EE885D3EF93F7E3E2992E46F1A","PreviousFields":{"Balance":"991481999390","Sequence":62},"PreviousTxnID":"2485FDC606352F1B0785DA5DE96FB9DBAF43EB60ECBB01B7F6FA970F512CDA5F","PreviousTxnLgrSeq":31317}}],"TransactionIndex":0,"TransactionResult":"tesSUCCESS"},"ledger_index":38129}',
    )

    ledger.parent_close_time = ledger.close_time

    function testCompute(ledgerToTest, expectedError): void {
      const hash = hashLedger(ledgerToTest)
      assert.strictEqual(
        hash,
        'E6DB7365949BF9814D76BCC730B01818EB9136A89DB224F3F9F5AAE4569D758E',
      )

      // fail if required to compute tree hashes
      assert.throws(
        () => hashLedger(ledgerToTest, { computeTreeHashes: true }),
        ValidationError,
        expectedError,
      )
    }

    const transactions = ledger.transactions
    delete ledger.transactions
    testCompute(ledger, 'transactions is missing from the ledger')
    delete ledger.accountState
    testCompute(ledger, 'transactions is missing from the ledger')
    ledger.transactions = transactions
    testCompute(ledger, 'accountState is missing from the ledger')
  })

  it('wrong hash', function () {
    const newLedger = {
      ...ledger,
      parent_close_time: ledger.close_time,
      account_hash:
        'D9ABF622DA26EEEE48203085D4BC23B0F77DC6F8724AC33D975DA3CA492D2E44',
    }

    assert.throws(
      () => {
        hashLedger(newLedger, { computeTreeHashes: true })
      },
      ValidationError,
      'does not match computed hash of state',
    )
  })

  it('hashLedger', function () {
    const header = REQUEST_FIXTURES.header
    const ledgerHash = hashLedger(header)

    assert.strictEqual(
      ledgerHash,
      'F4D865D83EB88C1A1911B9E90641919A1314F36E1B099F8E95FE3B7C77BE3349',
    )
  })

  it('hashLedger - with transactions', function () {
    const header = {
      ...REQUEST_FIXTURES.header,
      transactionHash: undefined,
      rawTransactions: REQUEST_FIXTURES.transactions,
    }
    const ledgerHash = hashLedger(header)
    assert.strictEqual(
      ledgerHash,
      'F4D865D83EB88C1A1911B9E90641919A1314F36E1B099F8E95FE3B7C77BE3349',
    )
  })

  it('hashLedger - incorrect transaction_hash', function () {
    const header = {
      ...REQUEST_FIXTURES.header,
      transaction_hash:
        '325EACC5271322539EEEC2D6A5292471EF1B3E72AE7180533EFC3B8F0AD435C9',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- okay for tests
      transactions: REQUEST_FIXTURES.transactions as any,
    }

    assert.throws(
      () => hashLedger(header, { computeTreeHashes: true }),
      ValidationError,
      'transactionHash in header does not match computed hash of transactions',
    )
  })
})
