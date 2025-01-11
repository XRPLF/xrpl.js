import { assert } from 'chai'

import {
  Batch,
  decode,
  ECDSA,
  encode,
  ValidationError,
  Wallet,
} from '../../src'
import {
  BatchInnerTransaction,
  BatchSigner,
} from '../../src/models/transactions/batch'
import {
  combineBatchSigners,
  signMultiBatch,
} from '../../src/Wallet/batchSigner'

const secpWallet = Wallet.fromSeed('spkcsko6Ag3RbCSVXV2FJ8Pd4Zac1', {
  algorithm: ECDSA.secp256k1,
})
const edWallet = Wallet.fromSeed('spkcsko6Ag3RbCSVXV2FJ8Pd4Zac1', {
  algorithm: ECDSA.ed25519,
})
const submitWallet = Wallet.fromSeed('sEd7HmQFsoyj5TAm6d98gytM9LJA1MF', {
  algorithm: ECDSA.ed25519,
})
const otherWallet = Wallet.generate()

interface RawTransaction {
  RawTransaction: BatchInnerTransaction
}

describe('Wallet batch operations', function () {
  describe('signMultiBatch', function () {
    let transaction: Batch

    beforeEach(() => {
      transaction = {
        Account: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
        Flags: 1,
        RawTransactions: [
          {
            RawTransaction: {
              Account: 'rJy554HmWFFJQGnRfZuoo8nV97XSMq77h7',
              Flags: 0x40000000,
              Amount: '5000000',
              Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
              Fee: '0',
              Sequence: 215,
              SigningPubKey: '',
              TransactionType: 'Payment',
            },
          },
          {
            RawTransaction: {
              Account: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
              Flags: 0x40000000,
              Amount: '1000000',
              Destination: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
              Fee: '0',
              Sequence: 470,
              SigningPubKey: '',
              TransactionType: 'Payment',
            },
          },
        ],
        TransactionType: 'Batch',
      }
    })
    it('succeeds with secp256k1 seed', function () {
      signMultiBatch(secpWallet, transaction)
      const expected = [
        {
          BatchSigner: {
            Account: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
            SigningPubKey:
              '02691AC5AE1C4C333AE5DF8A93BDC495F0EEBFC6DB0DA7EB6EF808F3AFC006E3FE',
            TxnSignature:
              '304402207E8238D3D2B24B98BA925D69DDAFA3E7D07F85C8ABF1C040B3D1BEBE2C36E92B02200C122F7F3F86AB8FF89207539CAFB4613D665FF336796F99283ED94C66FB3094',
          },
        },
      ]
      assert.property(transaction, 'BatchSigners')
      assert.strictEqual(
        JSON.stringify(transaction.BatchSigners),
        JSON.stringify(expected),
      )
    })

    it('succeeds with ed25519 seed', function () {
      signMultiBatch(edWallet, transaction)
      const expected = [
        {
          BatchSigner: {
            Account: 'rJy554HmWFFJQGnRfZuoo8nV97XSMq77h7',
            SigningPubKey:
              'ED3CC3D14FD80C213BC92A98AFE13A405A030F845EDCFD5E395286A6E9E62BA638',
            TxnSignature:
              '744FF09C11399F3AC1484F909A92F2D836EA979CB7655BC8F6BC3793F18892F92A16FE41C60EDCD6C2B757FF85D179F1589824ECA397EEA208B94C9D108CDF0A',
          },
        },
      ]
      assert.property(transaction, 'BatchSigners')
      assert.strictEqual(
        JSON.stringify(transaction.BatchSigners),
        JSON.stringify(expected),
      )
    })

    it('fails with not-included account', function () {
      assert.throws(
        () => signMultiBatch(otherWallet, transaction),
        ValidationError,
        'Must be signing for an address included in the Batch.',
      )
    })
  })

  describe('combineBatchSigners', function () {
    let tx1: Batch
    let tx2: Batch
    const originalTx: Batch = {
      Account: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
      Flags: 1,
      LastLedgerSequence: 14973,
      NetworkID: 21336,
      RawTransactions: [
        {
          RawTransaction: {
            Account: 'rJy554HmWFFJQGnRfZuoo8nV97XSMq77h7',
            Flags: 0x40000000,
            Amount: '5000000',
            Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
            Fee: '0',
            Sequence: 215,
            SigningPubKey: '',
            TransactionType: 'Payment',
          },
        },
        {
          RawTransaction: {
            Account: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
            Flags: 0x40000000,
            Amount: '1000000',
            Destination: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
            Fee: '0',
            Sequence: 470,
            SigningPubKey: '',
            TransactionType: 'Payment',
          },
        },
      ],
      Sequence: 215,
      TransactionType: 'Batch',
    }
    let expectedValid: BatchSigner[]

    beforeEach(() => {
      tx1 = { ...originalTx }
      tx2 = { ...originalTx }
      signMultiBatch(edWallet, tx1)
      signMultiBatch(secpWallet, tx2)
      expectedValid = (tx1.BatchSigners ?? []).concat(tx2.BatchSigners ?? [])
    })

    it('combines valid transactions', function () {
      const result = combineBatchSigners([tx1, tx2])
      assert.deepEqual(decode(result).BatchSigners, expectedValid)
    })

    it('combines valid serialized transactions', function () {
      const result = combineBatchSigners([encode(tx1), encode(tx2)])
      assert.deepEqual(decode(result).BatchSigners, expectedValid)
    })

    it('sorts the signers', function () {
      const result = combineBatchSigners([tx2, tx1])
      assert.deepEqual(decode(result).BatchSigners, expectedValid)
    })

    it('removes signer for Batch submitter', function () {
      // add a third inner transaction from the transaction submitter
      const rawTx3: RawTransaction = {
        RawTransaction: {
          Account: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
          Amount: '1000000',
          Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
          Fee: '0',
          Flags: 0x40000000,
          Sequence: 470,
          SigningPubKey: '',
          TransactionType: 'Payment',
        },
      }
      const rawTxs = originalTx.RawTransactions.concat(rawTx3)

      // set up all the transactions again (repeat what's done in `beforeEach`)
      const newTx = {
        ...originalTx,
        RawTransactions: rawTxs,
      }
      tx1 = { ...newTx }
      tx2 = { ...newTx }
      const tx3 = { ...newTx }
      signMultiBatch(edWallet, tx1)
      signMultiBatch(secpWallet, tx2)
      signMultiBatch(submitWallet, tx3)

      // run test
      const result = combineBatchSigners([tx1, tx2, tx3])
      const expected = (tx1.BatchSigners ?? []).concat(tx2.BatchSigners ?? [])
      assert.deepEqual(decode(result).BatchSigners, expected)
    })
  })
})
