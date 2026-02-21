import { assert } from 'chai'

import {
  Ledger,
  LedgerV1,
  LedgerTransactionExpanded,
  LedgerTransactionExpandedV1,
} from '../../src/models/ledger/Ledger'

describe('LedgerTransactionExpanded types', function () {
  it('Ledger (v2) transactions use flat format with metaData', function () {
    const tx: LedgerTransactionExpanded = {
      Account: 'rPrioTXJgZJF8bpdXq2X73PcVPfvYqjVKd',
      TransactionType: 'Payment',
      Fee: '11',
      Sequence: 1,
      Flags: 0,
      SigningPubKey: '',
      TxnSignature: '',
      hash: '044314FE34236A262DA692789CE5B48CA1A3CEC078B1A4ECCD65F4B61A9EB0A7',
      metaData: {
        AffectedNodes: [],
        TransactionIndex: 0,
        TransactionResult: 'tesSUCCESS',
      },
    }

    // Verify v2 expanded transactions are assignable to Ledger.transactions
    const ledgerV2: Pick<Ledger, 'transactions'> = {
      transactions: [tx],
    }

    assert.isArray(ledgerV2.transactions)
    assert.strictEqual(ledgerV2.transactions![0].hash, tx.hash)
    assert.isDefined(ledgerV2.transactions![0].metaData)
  })

  it('LedgerV1 transactions use wrapped format with tx_json and meta', function () {
    const tx: LedgerTransactionExpandedV1 = {
      tx_json: {
        Account: 'rPrioTXJgZJF8bpdXq2X73PcVPfvYqjVKd',
        TransactionType: 'Payment',
        Fee: '11',
        Sequence: 1,
        Flags: 0,
        SigningPubKey: '',
        TxnSignature: '',
      },
      meta: {
        AffectedNodes: [],
        TransactionIndex: 0,
        TransactionResult: 'tesSUCCESS',
      },
      hash: '044314FE34236A262DA692789CE5B48CA1A3CEC078B1A4ECCD65F4B61A9EB0A7',
      validated: true,
      ledger_index: 93637993,
      close_time_iso: '2025-01-22T21:13:50Z',
      ledger_hash:
        '058FDA696458896EC515AC19C3EDC8CD0E163A3620CA6B314165E5BAED70846A',
    }

    // Verify v1 expanded transactions are assignable to LedgerV1.transactions
    const ledgerV1: Pick<LedgerV1, 'transactions'> = {
      transactions: [tx],
    }

    assert.isArray(ledgerV1.transactions)
    assert.strictEqual(ledgerV1.transactions![0].hash, tx.hash)
    assert.isDefined(ledgerV1.transactions![0].tx_json)
    assert.isDefined(ledgerV1.transactions![0].meta)
  })
})
