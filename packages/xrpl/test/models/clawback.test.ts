import { assert } from 'chai'

import { validate, ValidationError } from '../../src'

/**
 * Clawback Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('Clawback', function () {
  it(`verifies valid Clawback`, function () {
    const validClawback = {
      TransactionType: 'Clawback',
      Amount: {
        currency: 'DSH',
        issuer: 'rcXY84C4g14iFp6taFXjjQGVeHqSCh9RX',
        value: '43.11584856965009',
      },
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assert.doesNotThrow(() => validate(validClawback))
  })

  it(`throws w/ missing Amount`, function () {
    const missingAmount = {
      TransactionType: 'Clawback',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assert.throws(
      () => validate(missingAmount),
      ValidationError,
      'Clawback: missing field Amount',
    )
  })

  it(`throws w/ invalid Amount`, function () {
    const invalidAmount = {
      TransactionType: 'Clawback',
      Amount: 100000000,
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assert.throws(
      () => validate(invalidAmount),
      ValidationError,
      'Clawback: invalid Amount',
    )

    const invalidStrAmount = {
      TransactionType: 'Clawback',
      Amount: '1234',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assert.throws(
      () => validate(invalidStrAmount),
      ValidationError,
      'Clawback: invalid Amount',
    )
  })

  it(`throws w/ invalid holder Account`, function () {
    const invalidAccount = {
      TransactionType: 'Clawback',
      Amount: {
        currency: 'DSH',
        issuer: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
        value: '43.11584856965009',
      },
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assert.throws(
      () => validate(invalidAccount),
      ValidationError,
      'Clawback: invalid holder Account',
    )
  })

  it(`verifies valid MPT Clawback`, function () {
    const validClawback = {
      TransactionType: 'Clawback',
      Amount: {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
        value: '10',
      },
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
    } as any

    assert.doesNotThrow(() => validate(validClawback))
  })

  it(`throws w/ invalid Holder Account`, function () {
    const invalidAccount = {
      TransactionType: 'Clawback',
      Amount: {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
        value: '10',
      },
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assert.throws(
      () => validate(invalidAccount),
      ValidationError,
      'Clawback: invalid holder Account',
    )
  })

  it(`throws w/ invalid Holder`, function () {
    const invalidAccount = {
      TransactionType: 'Clawback',
      Amount: {
        mpt_issuance_id: '000004C463C52827307480341125DA0577DEFC38405B0E3E',
        value: '10',
      },
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assert.throws(
      () => validate(invalidAccount),
      ValidationError,
      'Clawback: missing Holder',
    )
  })

  it(`throws w/ invalid currency Holder`, function () {
    const invalidAccount = {
      TransactionType: 'Clawback',
      Amount: {
        currency: 'DSH',
        issuer: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
        value: '43.11584856965009',
      },
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
    } as any

    assert.throws(
      () => validate(invalidAccount),
      ValidationError,
      'Clawback: cannot have Holder for currency',
    )
  })
})
