import {
  SponsorshipSetFlags,
  validateSponsorshipSet,
} from '../../src/models/transactions/sponsorshipSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateSponsorshipSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateSponsorshipSet, message)

/**
 * SponsorshipSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SponsorshipSet', function () {
  let sponsorshipSetTx: any

  beforeEach(function () {
    sponsorshipSetTx = {
      TransactionType: 'SponsorshipSet',
      Account: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
      Sponsee: 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy',
      Fee: '12',
    } as any
  })

  it('verifies valid SponsorshipSet', function () {
    assertValid(sponsorshipSetTx)
  })

  it('verifies valid SponsorshipSet with MaxFee', function () {
    sponsorshipSetTx.MaxFee = '1000'
    assertValid(sponsorshipSetTx)
  })

  it('verifies valid SponsorshipSet with positive FeeAmountDelta', function () {
    sponsorshipSetTx.FeeAmountDelta = '1000000'
    assertValid(sponsorshipSetTx)
  })

  it('verifies valid SponsorshipSet with negative FeeAmountDelta', function () {
    sponsorshipSetTx.FeeAmountDelta = '-1000000'
    assertValid(sponsorshipSetTx)
  })

  it('throws when FeeAmountDelta is not a string', function () {
    sponsorshipSetTx.FeeAmountDelta = 1000000
    assertInvalid(
      sponsorshipSetTx,
      'SponsorshipSet: FeeAmountDelta must be a string',
    )
  })

  it('throws when FeeAmountDelta is not numeric', function () {
    sponsorshipSetTx.FeeAmountDelta = 'not_a_number'
    assertInvalid(
      sponsorshipSetTx,
      'SponsorshipSet: FeeAmountDelta must be a numeric string',
    )
  })

  it('throws when FeeAmountDelta is zero', function () {
    sponsorshipSetTx.FeeAmountDelta = '0'
    assertInvalid(
      sponsorshipSetTx,
      'SponsorshipSet: FeeAmountDelta must not be zero',
    )
  })

  it('throws when FeeAmountDelta is negative zero', function () {
    sponsorshipSetTx.FeeAmountDelta = '-0'
    assertInvalid(
      sponsorshipSetTx,
      'SponsorshipSet: FeeAmountDelta must not be zero',
    )
  })

  it('verifies valid SponsorshipSet with tfDeleteObject flag', function () {
    sponsorshipSetTx.Flags = SponsorshipSetFlags.tfDeleteObject
    assertValid(sponsorshipSetTx)
  })

  it('verifies valid SponsorshipSet with boolean tfDeleteObject flag', function () {
    sponsorshipSetTx.Flags = { tfDeleteObject: true }
    assertValid(sponsorshipSetTx)
  })

  it('throws when Sponsee is missing', function () {
    delete sponsorshipSetTx.Sponsee
    assertInvalid(
      sponsorshipSetTx,
      'SponsorshipSet: must have either Sponsee or CounterpartySponsor',
    )
  })

  it('throws when Sponsee is not a string', function () {
    sponsorshipSetTx.Sponsee = 123
    assertInvalid(sponsorshipSetTx, 'SponsorshipSet: Sponsee must be a string')
  })

  it('throws when Sponsee is not a valid account address', function () {
    sponsorshipSetTx.Sponsee = 'invalid_address'
    assertInvalid(
      sponsorshipSetTx,
      'SponsorshipSet: Sponsee must be a valid account address',
    )
  })

  it('throws when Account and Sponsee are the same', function () {
    sponsorshipSetTx.Sponsee = sponsorshipSetTx.Account
    assertInvalid(
      sponsorshipSetTx,
      'SponsorshipSet: Account and Sponsee cannot be the same',
    )
  })

  it('throws when MaxFee is not a string', function () {
    sponsorshipSetTx.MaxFee = 1000
    assertInvalid(sponsorshipSetTx, 'SponsorshipSet: MaxFee must be a string')
  })

  it('throws when MaxFee is negative', function () {
    sponsorshipSetTx.MaxFee = '-100'
    assertInvalid(
      sponsorshipSetTx,
      'SponsorshipSet: MaxFee must be a non-negative numeric string',
    )
  })

  it('throws when MaxFee is not numeric', function () {
    sponsorshipSetTx.MaxFee = 'not_a_number'
    assertInvalid(
      sponsorshipSetTx,
      'SponsorshipSet: MaxFee must be a non-negative numeric string',
    )
  })

  it('verifies valid SponsorshipSet with MaxFee as zero', function () {
    sponsorshipSetTx.MaxFee = '0'
    assertValid(sponsorshipSetTx)
  })

  it('verifies valid SponsorshipSet with large MaxFee', function () {
    sponsorshipSetTx.MaxFee = '100000000000'
    assertValid(sponsorshipSetTx)
  })

  it('verifies valid SponsorshipSet with X-Address for Sponsee', function () {
    sponsorshipSetTx.Sponsee = 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi'
    assertValid(sponsorshipSetTx)
  })

  it('verifies valid SponsorshipSet with X-Address for Account', function () {
    sponsorshipSetTx.Account = 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi'
    assertValid(sponsorshipSetTx)
  })

  it('throws when both Account and Sponsee are the same X-Address', function () {
    const xAddress = 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi'
    sponsorshipSetTx.Account = xAddress
    sponsorshipSetTx.Sponsee = xAddress
    assertInvalid(
      sponsorshipSetTx,
      'SponsorshipSet: Account and Sponsee cannot be the same',
    )
  })

  it('verifies valid SponsorshipSet with all optional fields', function () {
    sponsorshipSetTx.MaxFee = '5000'
    sponsorshipSetTx.Flags = SponsorshipSetFlags.tfDeleteObject
    sponsorshipSetTx.Memos = [
      {
        Memo: {
          MemoData: '54657374',
        },
      },
    ]
    assertValid(sponsorshipSetTx)
  })
})
