import { assert } from 'chai'

import {
  Batch,
  decode,
  ECDSA,
  encode,
  ValidationError,
  Wallet,
} from '../../src'
import { BatchInnerTransaction } from '../../src/models/transactions/batch'
import { hashSignedTx } from '../../src/utils/hashes'
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
              Amount: '5000000',
              BatchTxn: {
                BatchIndex: 1,
                OuterAccount: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
                Sequence: 215,
              },
              Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
              Fee: '0',
              NetworkID: 21336,
              Sequence: 0,
              SigningPubKey: '',
              TransactionType: 'Payment',
            },
          },
          {
            RawTransaction: {
              Account: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
              Amount: '1000000',
              BatchTxn: {
                BatchIndex: 0,
                OuterAccount: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
                Sequence: 470,
              },
              Destination: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
              Fee: '0',
              NetworkID: 21336,
              Sequence: 0,
              SigningPubKey: '',
              TransactionType: 'Payment',
            },
          },
        ],
        TransactionType: 'Batch',
        TxIDs: [
          'ABE4871E9083DF66727045D49DEEDD3A6F166EB7F8D1E92FE868F02E76B2C5CA',
          '795AAC88B59E95C3497609749127E69F12958BC016C600C770AEEB1474C840B4',
        ],
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
              '30450221008E595499C334127A23190F61FB9ADD8B8C501D543E37945B11FABB66B097A6130220138C908E8C4929B47E994A46D611FAC17AB295CFB8D9E0828B32F2947B97394B',
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
              'E3337EE8C746523B5F96BEBE1190164B8B384EE2DC99F327D95ABC14E27F3AE16CC00DA7D61FC535DBFF0ADA3AF06394F8A703EE952A141BD871B75166C5CD0A',
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
            Amount: '5000000',
            BatchTxn: {
              BatchIndex: 1,
              OuterAccount: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
              Sequence: 215,
            },
            Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
            Fee: '0',
            NetworkID: 21336,
            Sequence: 0,
            SigningPubKey: '',
            TransactionType: 'Payment',
          },
        },
        {
          RawTransaction: {
            Account: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
            Amount: '1000000',
            BatchTxn: {
              BatchIndex: 0,
              OuterAccount: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
              Sequence: 470,
            },
            Destination: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
            Fee: '0',
            NetworkID: 21336,
            Sequence: 0,
            SigningPubKey: '',
            TransactionType: 'Payment',
          },
        },
      ],
      Sequence: 215,
      TransactionType: 'Batch',
      TxIDs: [
        'ABE4871E9083DF66727045D49DEEDD3A6F166EB7F8D1E92FE868F02E76B2C5CA',
        '795AAC88B59E95C3497609749127E69F12958BC016C600C770AEEB1474C840B4',
      ],
    }
    let expectedValid

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
          BatchTxn: {
            BatchIndex: 0,
            OuterAccount: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
            Sequence: 470,
          },
          Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
          Fee: '0',
          NetworkID: 21336,
          Sequence: 0,
          SigningPubKey: '',
          TransactionType: 'Payment',
        },
      }
      const rawTxs = originalTx.RawTransactions.concat(rawTx3)
      const txIds = originalTx.TxIDs?.concat([
        hashSignedTx(rawTx3.RawTransaction),
      ])

      // set up all the transactions again (repeat what's done in `beforeEach`)
      const newTx = { ...originalTx, RawTransactions: rawTxs, TxIDs: txIds }
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
