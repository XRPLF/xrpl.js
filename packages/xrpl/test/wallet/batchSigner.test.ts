import { assert } from 'chai'

import {
  Batch,
  decode,
  ECDSA,
  encode,
  SubmittableTransaction,
  ValidationError,
  Wallet,
} from '../../src'
import { BatchFlags, BatchSigner } from '../../src/models/transactions/batch'
import {
  combineBatchSigners,
  signMultiBatch,
} from '../../src/Wallet/batchSigner'

// rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK
const secpWallet = Wallet.fromSeed('spkcsko6Ag3RbCSVXV2FJ8Pd4Zac1', {
  algorithm: ECDSA.secp256k1,
})

// rJy554HmWFFJQGnRfZuoo8nV97XSMq77h7
const edWallet = Wallet.fromSeed('spkcsko6Ag3RbCSVXV2FJ8Pd4Zac1', {
  algorithm: ECDSA.ed25519,
})

// rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp
const submitWallet = Wallet.fromSeed('sEd7HmQFsoyj5TAm6d98gytM9LJA1MF', {
  algorithm: ECDSA.ed25519,
})

// rwRNeznwHzdfYeKWpevYmax2NSDioyeEtT
const regkeyWallet = Wallet.fromSeed('sEdStM1pngFcLQqVfH3RQcg2Qr6ov9e', {
  algorithm: ECDSA.ed25519,
})
const otherWallet = Wallet.generate()

const nonBatchTx = {
  TransactionType: 'Payment',
  Account: 'rJy554HmWFFJQGnRfZuoo8nV97XSMq77h7',
  Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
  Amount: '1000',
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
              '304502210098890858AA57D6515D7C523FE076FA97BFA87DA666A87B4A7CF44249181DC1DC02201B90E513FE2F45D41FB31850F463C0ECBA8F5126B1AF431B67C4004CA0DD8042',
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
              '27B496F0C1F2C4789A0E6CF25265069980190C786053CF5D6C066C07E21D632A6EB87C56275109A8542EEDE782FDC5591EA51FAF28C3FCFCF35BCE960F1D8601',
          },
        },
      ]
      assert.property(transaction, 'BatchSigners')
      assert.strictEqual(
        JSON.stringify(transaction.BatchSigners),
        JSON.stringify(expected),
      )
    })

    it('succeeds with a different account', function () {
      signMultiBatch(regkeyWallet, transaction, {
        batchAccount: edWallet.address,
      })
      const expected = [
        {
          BatchSigner: {
            Account: 'rJy554HmWFFJQGnRfZuoo8nV97XSMq77h7',
            SigningPubKey:
              'ED37D3F048B7F1E680B0A97F70C7843160B9F25D6398D07E68B9A2C83AA8E1B156',
            TxnSignature:
              '046315C731DF089E08EB6662251F12B22938ED462F66BC561A847A87DF6B3C9AC811D9EC5971EDEC2BA96C959BDE883CD838B7EF6460A47AD9B71518F1A2A00B',
          },
        },
      ]
      assert.property(transaction, 'BatchSigners')
      assert.strictEqual(
        JSON.stringify(transaction.BatchSigners),
        JSON.stringify(expected),
      )
    })

    it('succeeds with multisign', function () {
      signMultiBatch(regkeyWallet, transaction, {
        batchAccount: edWallet.address,
        multisign: true,
      })
      const expected = [
        {
          BatchSigner: {
            Account: 'rJy554HmWFFJQGnRfZuoo8nV97XSMq77h7',
            Signers: [
              {
                Signer: {
                  Account: 'rwRNeznwHzdfYeKWpevYmax2NSDioyeEtT',
                  SigningPubKey:
                    'ED37D3F048B7F1E680B0A97F70C7843160B9F25D6398D07E68B9A2C83AA8E1B156',
                  TxnSignature:
                    '8FCA6C1056C2146DC13F4D10BA297335A82F562D837FA3C65D75DCDC87540F61428B7370FCC1DE4D83B6FA1A00A18CD9283E7B08089091ED84CC3E4A8B43F00F',
                },
              },
            ],
          },
        },
      ]
      assert.property(transaction, 'BatchSigners')
      assert.strictEqual(
        JSON.stringify(transaction.BatchSigners),
        JSON.stringify(expected),
      )
    })

    it('succeeds with multisign + regular key', function () {
      signMultiBatch(regkeyWallet, transaction, {
        batchAccount: edWallet.address,
        multisign: submitWallet.address,
      })
      const expected = [
        {
          BatchSigner: {
            Account: 'rJy554HmWFFJQGnRfZuoo8nV97XSMq77h7',
            Signers: [
              {
                Signer: {
                  Account: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
                  SigningPubKey:
                    'ED37D3F048B7F1E680B0A97F70C7843160B9F25D6398D07E68B9A2C83AA8E1B156',
                  TxnSignature:
                    'D80D4195BF67D5CB12CA225D04DA4D00AC77250803671E09DF61F1695A831FAD6BF820F335DD2D8CFE16DA55CFC2E64AEC8A1429524E6CDB6C36B7AEA717C700',
                },
              },
            ],
          },
        },
      ]
      assert.property(transaction, 'BatchSigners')
      assert.strictEqual(
        JSON.stringify(transaction.BatchSigners),
        JSON.stringify(expected),
      )
    })

    it('requires the delegate, not the account, to sign a delegated inner transaction', function () {
      // Delegate the first inner transaction to regkeyWallet.
      transaction.RawTransactions[0].RawTransaction.Delegate =
        regkeyWallet.address

      // The inner account holder (edWallet) is no longer a required signer.
      assert.throws(
        () => signMultiBatch(edWallet, transaction),
        ValidationError,
        'Must be signing for an address submitting a transaction in the Batch.',
      )

      // The delegate can sign on its behalf.
      signMultiBatch(regkeyWallet, transaction)
      assert.strictEqual(
        transaction.BatchSigners?.[0].BatchSigner.Account,
        regkeyWallet.address,
      )
    })

    it('fails with not-included account', function () {
      assert.throws(
        () => signMultiBatch(otherWallet, transaction),
        ValidationError,
        'Must be signing for an address submitting a transaction in the Batch.',
      )
    })

    it('fails with non-Batch transaction', function () {
      assert.throws(
        // @ts-expect-error - needed for JS/codecov
        () => signMultiBatch(edWallet, nonBatchTx),
        ValidationError,
        'Must be a Batch transaction.',
      )
    })
  })

  describe('combineBatchSigners', function () {
    let tx1: Batch
    let tx2: Batch
    const originalTx: Batch = {
      Account: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
      Flags: BatchFlags.tfAllOrNothing,
      LastLedgerSequence: 14973,
      NetworkID: 21336,
      RawTransactions: [
        {
          RawTransaction: {
            Account: 'rJy554HmWFFJQGnRfZuoo8nV97XSMq77h7',
            Amount: '5000000',
            Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
            Fee: '0',
            Flags: 0x40000000,
            Sequence: 215,
            SigningPubKey: '',
            TransactionType: 'Payment',
          },
        },
        {
          RawTransaction: {
            Account: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
            Amount: '1000000',
            Destination: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
            Fee: '0',
            Flags: 0x40000000,
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
      const rawTx3: { RawTransaction: SubmittableTransaction } = {
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

    it('fails with no transactions provided', function () {
      assert.throws(
        () => combineBatchSigners([]),
        ValidationError,
        'There are 0 transactions to combine.',
      )
    })

    it('fails with non-Batch transaction provided', function () {
      assert.throws(
        // @ts-expect-error - needed for JS/codecov
        () => combineBatchSigners([tx1, tx2, nonBatchTx]),
        ValidationError,
        'TransactionType must be `Batch`.',
      )
    })

    it('fails with no BatchSigners provided in a transaction', function () {
      const badTx1 = { ...tx1 }
      delete badTx1.BatchSigners
      assert.throws(
        () => combineBatchSigners([badTx1, tx2]),
        ValidationError,
        'For combining Batch transaction signatures, all transactions must include a BatchSigners field containing an array of signatures.',
      )

      badTx1.BatchSigners = []
      assert.throws(
        () => combineBatchSigners([badTx1, tx2]),
        ValidationError,
        'For combining Batch transaction signatures, all transactions must include a BatchSigners field containing an array of signatures.',
      )
    })

    it('fails with signed inner transaction', function () {
      assert.throws(
        () => combineBatchSigners([secpWallet.sign(tx1).tx_blob, tx2]),
        ValidationError,
        'Batch transaction must be unsigned.',
      )
    })

    it('fails with different flags signed', function () {
      const badTx2 = { ...tx2 }
      badTx2.Flags = BatchFlags.tfIndependent
      signMultiBatch(secpWallet, tx2)
      assert.throws(
        () => combineBatchSigners([tx1, badTx2]),
        ValidationError,
        'Account, sequence, flags, and transaction hashes must be the same for all provided transactions.',
      )
    })

    it('fails with different outer Account signed', function () {
      const badTx2 = { ...tx2, Account: 'rJy554HmWFFJQGnRfZuoo8nV97XSMq77h7' }
      assert.throws(
        () => combineBatchSigners([tx1, badTx2]),
        ValidationError,
        'Account, sequence, flags, and transaction hashes must be the same for all provided transactions.',
      )
    })

    it('fails with different Sequence signed', function () {
      const badTx2 = { ...tx2, Sequence: 216 }
      assert.throws(
        () => combineBatchSigners([tx1, badTx2]),
        ValidationError,
        'Account, sequence, flags, and transaction hashes must be the same for all provided transactions.',
      )
    })
  })
})
