import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import {
  SubscriptionSet,
  SubscriptionSetFlags,
} from '../../src/models/transactions'
import { validateSubscriptionSet } from '../../src/models/transactions/subscriptionSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateSubscriptionSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateSubscriptionSet, message)

const ACCOUNT = 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn'
const DESTINATION = 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo'
const ISSUER = 'raKEEVSGnKSD9Zyvxu4z6Pqpm4ABH8FS6n'
const MPT_ISSUANCE_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
const AMOUNT_ERROR =
  'SubscriptionSet: Amount must be a positive XRP amount of at most 100000000000000000 drops, a positive IOU amount not in XRP, or a positive MPT amount of at most 9223372036854775807'

/**
 * SubscriptionSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SubscriptionSet', function () {
  let createTx: SubscriptionSet
  let updateTx: SubscriptionSet

  beforeEach(function () {
    createTx = {
      TransactionType: 'SubscriptionSet',
      Account: ACCOUNT,
      Destination: DESTINATION,
      Amount: '1000000',
      Frequency: 86400,
      StartTime: 800000000,
      Expiration: 900000000,
      DestinationTag: 1,
    }
    updateTx = {
      TransactionType: 'SubscriptionSet',
      Account: ACCOUNT,
      SubscriptionID:
        'E6DBAFC99223B42257915A63DFC6B0C032D4070F9A574B255AD97466726FC321',
      Amount: '2000000',
      Frequency: 0,
      Expiration: 0,
    }
  })

  it('verifies a valid SubscriptionSet that creates a subscription', function () {
    assertValid(createTx)
  })

  it('verifies a valid SubscriptionSet that updates a subscription', function () {
    assertValid(updateTx)
  })

  it('verifies a single-use create', function () {
    createTx.Flags = SubscriptionSetFlags.tfSingleUse
    assertValid(createTx)
    createTx.Flags = { tfSingleUse: true }
    assertValid(createTx)
  })

  it('verifies an IOU Amount', function () {
    createTx.Amount = { currency: 'USD', issuer: ISSUER, value: '10' }
    assertValid(createTx)
  })

  it('verifies an MPT Amount', function () {
    createTx.Amount = {
      mpt_issuance_id: MPT_ISSUANCE_ID,
      value: '9223372036854775807',
    }
    assertValid(createTx)
  })

  it('throws w/ an unknown flag', function () {
    createTx.Flags = 0x00020000
    assertInvalid(createTx, 'SubscriptionSet: invalid Flags')
  })

  it('throws w/ missing Amount', function () {
    // @ts-expect-error for test
    delete createTx.Amount
    assertInvalid(createTx, 'SubscriptionSet: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    // @ts-expect-error for test
    createTx.Amount = 1000000
    assertInvalid(createTx, 'SubscriptionSet: invalid field Amount')
  })

  it('throws w/ invalid Destination', function () {
    createTx.Destination = 'not-an-account'
    assertInvalid(createTx, 'SubscriptionSet: invalid field Destination')
  })

  it('throws w/ invalid Frequency', function () {
    // @ts-expect-error for test
    createTx.Frequency = '86400'
    assertInvalid(createTx, 'SubscriptionSet: invalid field Frequency')
  })

  it('throws w/ invalid StartTime', function () {
    // @ts-expect-error for test
    createTx.StartTime = '800000000'
    assertInvalid(createTx, 'SubscriptionSet: invalid field StartTime')
  })

  it('throws w/ invalid Expiration', function () {
    // @ts-expect-error for test
    createTx.Expiration = '900000000'
    assertInvalid(createTx, 'SubscriptionSet: invalid field Expiration')
  })

  it('throws w/ invalid DestinationTag', function () {
    // @ts-expect-error for test
    createTx.DestinationTag = '1'
    assertInvalid(createTx, 'SubscriptionSet: invalid field DestinationTag')
  })

  it('throws w/ invalid SubscriptionID', function () {
    updateTx.SubscriptionID = 'ABCD'
    assertInvalid(updateTx, 'SubscriptionSet: invalid field SubscriptionID')
  })

  describe('create and update rules', function () {
    it('throws w/ a create missing Destination', function () {
      delete createTx.Destination
      assertInvalid(
        createTx,
        'SubscriptionSet: Destination and Frequency are required to create a subscription',
      )
    })

    it('throws w/ a create missing Frequency', function () {
      delete createTx.Frequency
      assertInvalid(
        createTx,
        'SubscriptionSet: Destination and Frequency are required to create a subscription',
      )
    })

    it('throws w/ a create whose Destination is the Account', function () {
      createTx.Destination = ACCOUNT
      assertInvalid(
        createTx,
        'SubscriptionSet: Destination must not be the Account',
      )
    })

    it('throws w/ an update carrying Destination', function () {
      updateTx.Destination = DESTINATION
      assertInvalid(
        updateTx,
        'SubscriptionSet: Destination and StartTime cannot be changed on update',
      )
    })

    it('throws w/ an update carrying StartTime', function () {
      updateTx.StartTime = 800000000
      assertInvalid(
        updateTx,
        'SubscriptionSet: Destination and StartTime cannot be changed on update',
      )
    })

    it('throws w/ an update setting tfSingleUse', function () {
      updateTx.Flags = SubscriptionSetFlags.tfSingleUse
      assertInvalid(
        updateTx,
        'SubscriptionSet: tfSingleUse cannot be set on update',
      )
    })
  })

  describe('Amount rules', function () {
    it('throws w/ a zero XRP Amount', function () {
      createTx.Amount = '0'
      assertInvalid(createTx, AMOUNT_ERROR)
    })

    it('throws w/ a non-integer XRP Amount', function () {
      createTx.Amount = '1.5'
      assertInvalid(createTx, AMOUNT_ERROR)
    })

    it('throws w/ an XRP Amount above the XRP supply', function () {
      createTx.Amount = '100000000000000001'
      assertInvalid(createTx, AMOUNT_ERROR)
    })

    it('throws w/ a zero IOU Amount', function () {
      createTx.Amount = { currency: 'USD', issuer: ISSUER, value: '0' }
      assertInvalid(createTx, AMOUNT_ERROR)
    })

    it('throws w/ a negative IOU Amount', function () {
      createTx.Amount = { currency: 'USD', issuer: ISSUER, value: '-1' }
      assertInvalid(createTx, AMOUNT_ERROR)
    })

    it('throws w/ an IOU Amount in the XRP currency code', function () {
      createTx.Amount = { currency: 'XRP', issuer: ISSUER, value: '1' }
      assert.throws(
        () => validateSubscriptionSet(createTx),
        ValidationError,
        AMOUNT_ERROR,
      )
      assert.throws(
        () => validate(createTx),
        ValidationError,
        "Cannot have an issued currency with a similar standard code to XRP (received 'XRP'). XRP is not an issued currency.",
      )
    })

    it('throws w/ a zero MPT Amount', function () {
      createTx.Amount = { mpt_issuance_id: MPT_ISSUANCE_ID, value: '0' }
      assertInvalid(createTx, AMOUNT_ERROR)
    })

    it('throws w/ an MPT Amount above the MPT maximum', function () {
      createTx.Amount = {
        mpt_issuance_id: MPT_ISSUANCE_ID,
        value: '9223372036854775808',
      }
      assertInvalid(createTx, AMOUNT_ERROR)
    })
  })
})
