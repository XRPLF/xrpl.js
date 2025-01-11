import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateBatch } from '../../src/models/transactions/batch'

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
    }
  })

  it('verifies valid Batch', function () {
    assert.doesNotThrow(() => validateBatch(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ invalid BatchSigners', function () {
    tx.BatchSigners = 0

    assert.throws(
      () => validateBatch(tx),
      ValidationError,
      'Batch: invalid field BatchSigners',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'Batch: invalid field BatchSigners',
    )
  })

  it('throws w/ missing RawTransactions', function () {
    delete tx.RawTransactions

    assert.throws(
      () => validateBatch(tx),
      ValidationError,
      'Batch: missing field RawTransactions',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'Batch: missing field RawTransactions',
    )
  })

  it('throws w/ invalid RawTransactions', function () {
    tx.RawTransactions = 0
    assert.throws(
      () => validateBatch(tx),
      ValidationError,
      'Batch: invalid field RawTransactions',
    )
    assert.throws(
      () => validate(tx),
      ValidationError,
      'Batch: invalid field RawTransactions',
    )
  })
})
