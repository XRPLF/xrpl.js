import { validateCheckCreate } from '../../src/models/transactions/checkCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateCheckCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateCheckCreate, message)

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

    assertValid(validCheck)
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

    assertInvalid(invalidDestination, 'CheckCreate: invalid field Destination')
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

    assertInvalid(invalidSendMax, 'CheckCreate: invalid SendMax')
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
      DestinationTag: '1',
      Fee: '12',
    } as any

    assertInvalid(
      invalidDestinationTag,
      'CheckCreate: invalid field DestinationTag',
    )
  })

  it(`throws w/ invalid Expiration`, function () {
    const invalidExpiration = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SendMax: '100000000',
      Expiration: '570113521',
      InvoiceID:
        '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
      DestinationTag: 1,
      Fee: '12',
    } as any

    assertInvalid(invalidExpiration, 'CheckCreate: invalid Expiration')
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

    assertInvalid(invalidInvoiceID, 'CheckCreate: invalid InvoiceID')
  })
})
