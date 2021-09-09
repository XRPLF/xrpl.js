import { assert } from 'chai'

import { ValidationError } from 'xrpl-local/common/errors'

import { verifyEscrowCreate } from '../../src/models/transactions/escrowCreate'

/**
 * EscrowCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('EscrowCreate', function () {
  let escrow

  beforeEach(function () {
    escrow = {
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      TransactionType: 'EscrowCreate',
      Amount: '10000',
      Destination: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
      CancelAfter: 533257958,
      FinishAfter: 533171558,
      Condition:
        'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100',
      DestinationTag: 23480,
      SourceTag: 11747,
    }
  })

  it(`verifies valid EscrowCreate`, function () {
    assert.doesNotThrow(() => verifyEscrowCreate(escrow))
  })

  it(`Missing amount`, function () {
    delete escrow.Amount

    assert.throws(
      () => verifyEscrowCreate(escrow),
      ValidationError,
      'EscrowCreate: missing field Amount',
    )
  })

  it(`Missing destination`, function () {
    delete escrow.Destination

    assert.throws(
      () => verifyEscrowCreate(escrow),
      ValidationError,
      'EscrowCreate: missing field Destination',
    )
  })

  it(`throws w/ invalid Destination`, function () {
    escrow.Destination = 10

    assert.throws(
      () => verifyEscrowCreate(escrow),
      ValidationError,
      'EscrowCreate: Destination must be a string',
    )
  })

  it(`throws w/ invalid Amount`, function () {
    escrow.Amount = 1000

    assert.throws(
      () => verifyEscrowCreate(escrow),
      ValidationError,
      'EscrowCreate: Amount must be a string',
    )
  })

  it(`invalid CancelAfter`, function () {
    escrow.CancelAfter = '100'

    assert.throws(
      () => verifyEscrowCreate(escrow),
      ValidationError,
      'EscrowCreate: CancelAfter must be a number',
    )
  })

  it(`invalid FinishAfter`, function () {
    escrow.FinishAfter = '1000'

    assert.throws(
      () => verifyEscrowCreate(escrow),
      ValidationError,
      'EscrowCreate: FinishAfter must be a number',
    )
  })

  it(`invalid Condition`, function () {
    escrow.Condition = 0x141243

    assert.throws(
      () => verifyEscrowCreate(escrow),
      ValidationError,
      'EscrowCreate: Condition must be a string',
    )
  })

  it(`invalid DestinationTag`, function () {
    escrow.DestinationTag = '100'

    assert.throws(
      () => verifyEscrowCreate(escrow),
      ValidationError,
      'EscrowCreate: DestinationTag must be a number',
    )
  })

  it(`Missing both CancelAfter and FinishAfter`, function () {
    delete escrow.CancelAfter
    delete escrow.FinishAfter

    assert.throws(
      () => verifyEscrowCreate(escrow),
      ValidationError,
      'EscrowCreate: Either CancelAfter or FinishAfter must be specified',
    )
  })

  it(`Missing both Condition and FinishAfter`, function () {
    delete escrow.Condition
    delete escrow.FinishAfter

    assert.throws(
      () => verifyEscrowCreate(escrow),
      ValidationError,
      'EscrowCreate: Either Condition or FinishAfter must be specified',
    )
  })
})
