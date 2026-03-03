import { validateBatch } from '../../src/models/transactions/batch'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateBatch)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateBatch, message)

/**
 * Batch Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('Batch', function () {
  let tx: any

  beforeEach(function () {
    tx = {
      Account: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
      BatchSigners: [
        {
          BatchSigner: {
            Account: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
            SigningPubKey:
              '02691AC5AE1C4C333AE5DF8A93BDC495F0EEBFC6DB0DA7EB6EF808F3AFC006E3FE',
            TxnSignature:
              '30450221008E595499C334127A23190F61FB9ADD8B8C501D543E37945B11FABB66B097A6130220138C908E8C4929B47E994A46D611FAC17AB295CFB8D9E0828B32F2947B97394B',
          },
        },
      ],
      Flags: 1,
      RawTransactions: [
        {
          RawTransaction: {
            Account: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
            Amount: '5000000',
            Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
            Fee: '0',
            Flags: 0x40000000,
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
            Destination: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
            Fee: '0',
            Flags: 0x40000000,
            NetworkID: 21336,
            Sequence: 1,
            SigningPubKey: '',
            TransactionType: 'Payment',
          },
        },
      ],
      TransactionType: 'Batch',
    }
  })

  it('verifies valid Batch', function () {
    assertValid(tx)
  })

  it('verifies single-account Batch', function () {
    tx = {
      Account: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
      Flags: 1,
      RawTransactions: [
        {
          RawTransaction: {
            Account: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
            Amount: '5000000',
            Destination: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
            Fee: '0',
            Flags: 0x40000000,
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
            Destination: 'rJCxK2hX9tDMzbnn3cg1GU2g19Kfmhzxkp',
            Fee: '0',
            Flags: 0x40000000,
            NetworkID: 21336,
            Sequence: 1,
            SigningPubKey: '',
            TransactionType: 'Payment',
          },
        },
      ],
      TransactionType: 'Batch',
    }
    assertValid(tx)
  })

  it('throws w/ invalid BatchSigners', function () {
    tx.BatchSigners = 0
    assertInvalid(tx, 'Batch: invalid field BatchSigners')
  })

  it('throws w/ missing RawTransactions', function () {
    delete tx.RawTransactions
    assertInvalid(tx, 'Batch: missing field RawTransactions')
  })

  it('throws w/ invalid RawTransactions', function () {
    tx.RawTransactions = 0
    assertInvalid(tx, 'Batch: invalid field RawTransactions')
  })

  it('throws w/ invalid RawTransactions object', function () {
    tx.RawTransactions = [0]
    assertInvalid(tx, 'Batch: RawTransactions[0] is not object')
  })

  it('throws w/ invalid RawTransactions.RawTransaction object', function () {
    tx.RawTransactions = [{ RawTransaction: 0 }]
    assertInvalid(tx, 'Batch: invalid field RawTransactions[0].RawTransaction')
  })

  it('throws w/ nested Batch', function () {
    tx.RawTransactions = [{ RawTransaction: tx }]
    assertInvalid(
      tx,
      'Batch: RawTransactions[0] is a Batch transaction. Cannot nest Batch transactions.',
    )
  })

  it('throws w/ non-object in BatchSigner list', function () {
    tx.BatchSigners = [1]
    assertInvalid(tx, 'Batch: BatchSigners[0] is not object.')
  })

  it('throws w/ no `tfInnerBatchTxn` flag in inner transaction', function () {
    tx.RawTransactions[0].RawTransaction.Flags = 0
    assertInvalid(
      tx,
      'Batch: RawTransactions[0] must contain the `tfInnerBatchTxn` flag.',
    )
  })
})
