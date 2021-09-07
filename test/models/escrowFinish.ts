import { assert } from 'chai'

import { ValidationError } from 'xrpl-local/common/errors'

import { verifyEscrowFinish } from '../../src/models/transactions/escrowFinish'

/**
 * EscrowFinish Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('EscrowFinish', function () {
  let escrow

  beforeEach(function () {
    escrow = {
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      TransactionType: 'EscrowFinish',
      Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      OfferSequence: 7,
      Condition:
        'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100',
      Fulfillment: 'A0028000',
    }
  })
  it(`verifies valid EscrowFinish`, function () {
    assert.doesNotThrow(() => verifyEscrowFinish(escrow))
  })

  it(`verifies valid EscrowFinish w/o optional`, function () {
    delete escrow.Condition
    delete escrow.Fulfillment

    assert.doesNotThrow(() => verifyEscrowFinish(escrow))
  })

  it(`throws w/ invalid Owner`, function () {
    escrow.Owner = 0x15415253

    assert.throws(
      () => verifyEscrowFinish(escrow),
      ValidationError,
      'EscrowFinish: Owner must be a string',
    )
  })

  it(`throws w/ invalid OfferSequence`, function () {
    escrow.OfferSequence = '10'

    assert.throws(
      () => verifyEscrowFinish(escrow),
      ValidationError,
      'EscrowFinish: OfferSequence must be a number',
    )
  })

  it(`throws w/ invalid Condition`, function () {
    escrow.Condition = 10

    assert.throws(
      () => verifyEscrowFinish(escrow),
      ValidationError,
      'EscrowFinish: Condition must be a string',
    )
  })

  it(`throws w/ invalid Fulfillment`, function () {
    escrow.Fulfillment = 0x142341

    assert.throws(
      () => verifyEscrowFinish(escrow),
      ValidationError,
      'EscrowFinish: Fulfillment must be a string',
    )
  })
})
