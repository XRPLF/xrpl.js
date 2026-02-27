import { validateCheckCreate } from '../../src/models/transactions/checkCreate'
import {
  assertTxIsValid,
  assertTxValidationError,
  MPT_ISSUANCE_ID_1,
  MPTID_LENGTH,
} from '../testUtils'

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

  // MPT-related tests
  it(`verifies valid CheckCreate with MPT SendMax`, function () {
    const validCheck = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SendMax: {
        mpt_issuance_id: MPT_ISSUANCE_ID_1,
        value: '50',
      },
      Fee: '12',
    } as any

    assertValid(validCheck)
  })

  it(`verifies valid CheckCreate with MPT SendMax and optional fields`, function () {
    const validCheck = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SendMax: {
        mpt_issuance_id: MPT_ISSUANCE_ID_1,
        value: '50',
      },
      DestinationTag: 1,
      Expiration: 970113521,
      InvoiceID:
        '6F1DFD1D0FE8A32E40E1F2C05CF1C15545BAB56B617F9C6C2D63A6B704BEF59B',
      Fee: '12',
    } as any

    assertValid(validCheck)
  })

  it(`throws w/ MPT SendMax mpt_issuance_id contains non-hex characters`, function () {
    const invalidCheck = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SendMax: {
        mpt_issuance_id: 'Z'.repeat(MPTID_LENGTH),
        value: '50',
      },
      Fee: '12',
    } as any

    assertInvalid(invalidCheck, 'CheckCreate: invalid SendMax')
  })

  it(`throws w/ MPT SendMax mpt_issuance_id too short`, function () {
    const invalidCheck = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SendMax: {
        mpt_issuance_id: 'A'.repeat(MPTID_LENGTH - 1),
        value: '50',
      },
      Fee: '12',
    } as any

    assertInvalid(invalidCheck, 'CheckCreate: invalid SendMax')
  })

  it(`throws w/ MPT SendMax mpt_issuance_id too long`, function () {
    const invalidCheck = {
      TransactionType: 'CheckCreate',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      Destination: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      SendMax: {
        mpt_issuance_id: 'A'.repeat(MPTID_LENGTH + 1),
        value: '50',
      },
      Fee: '12',
    } as any

    assertInvalid(invalidCheck, 'CheckCreate: invalid SendMax')
  })
})
