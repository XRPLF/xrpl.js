import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateCheckCreate } from '../../src/models/transactions/checkCreate'

/**
 * CheckCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('CheckCreate', function () {
  it(`verifies valid CheckCreate`, function () {
    const validCheck = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SendMax: '100000000',
      Expiration: 570113521,
      InvoiceID:
        '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
      DestinationTag: 1,
      Fee: '12',
    } as any

    assert.doesNotThrow(() => validateCheckCreate(validCheck))
    assert.doesNotThrow(() => validate(validCheck))
  })

  it(`throws w/ invalid Destination`, function () {
    const invalidDestination = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 7896214789632154,
      SendMax: '100000000',
      Expiration: 570113521,
      InvoiceID:
        '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
      DestinationTag: 1,
      Fee: '12',
    } as any

    assert.throws(
      () => validateCheckCreate(invalidDestination),
      ValidationError,
      'CheckCreate: invalid field Destination',
    )
    assert.throws(
      () => validate(invalidDestination),
      ValidationError,
      'CheckCreate: invalid field Destination',
    )
  })

  it(`throws w/ invalid SendMax`, function () {
    const invalidSendMax = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SendMax: 100000000,
      Expiration: 570113521,
      InvoiceID:
        '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
      DestinationTag: 1,
      Fee: '12',
    } as any

    assert.throws(
      () => validateCheckCreate(invalidSendMax),
      ValidationError,
      'CheckCreate: invalid field SendMax',
    )
    assert.throws(
      () => validate(invalidSendMax),
      ValidationError,
      'CheckCreate: invalid field SendMax',
    )
  })

  it(`throws w/ invalid DestinationTag`, function () {
    const invalidDestinationTag = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SendMax: '100000000',
      Expiration: 570113521,
      InvoiceID:
        '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
      DestinationTag: 'abcd',
      Fee: '12',
    } as any

    assert.throws(
      () => validateCheckCreate(invalidDestinationTag),
      ValidationError,
      'CheckCreate: invalid field DestinationTag',
    )
    assert.throws(
      () => validate(invalidDestinationTag),
      ValidationError,
      'CheckCreate: invalid field DestinationTag',
    )
  })

  it(`throws w/ invalid Expiration`, function () {
    const invalidExpiration = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SendMax: '100000000',
      Expiration: 'abcd',
      InvoiceID:
        '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
      DestinationTag: 1,
      Fee: '12',
    } as any

    assert.throws(
      () => validateCheckCreate(invalidExpiration),
      ValidationError,
      'CheckCreate: invalid field Expiration',
    )
    assert.throws(
      () => validate(invalidExpiration),
      ValidationError,
      'CheckCreate: invalid field Expiration',
    )
  })

  it(`throws w/ invalid InvoiceID`, function () {
    const invalidInvoiceID = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SendMax: '100000000',
      Expiration: 570113521,
      InvoiceID: 789656963258531,
      DestinationTag: 1,
      Fee: '12',
    } as any

    assert.throws(
      () => validateCheckCreate(invalidInvoiceID),
      ValidationError,
      'CheckCreate: invalid field InvoiceID',
    )
    assert.throws(
      () => validate(invalidInvoiceID),
      ValidationError,
      'CheckCreate: invalid field InvoiceID',
    )
  })
})
