import { validateTrustSet } from '../../src/models/transactions/trustSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateTrustSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateTrustSet, message)

/**
 * SponsorshipSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SponsorshipSet', function () {
  let sponsorshipSet: any

  beforeEach(function () {
    sponsorshipSet = {
      TransactionType: 'SponsorshipSet',
      SponsorAccount: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      FeeAmount: '100',
      MaxFee: '100',
      ReserveCount: 1,
    }
  })

  it('verifies valid SponsorshipSet', function () {
    assertValid(sponsorshipSet)

    delete sponsorshipSet.SponsorAccount
    sponsorshipSet.Sponsee = 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo'
    assertValid(sponsorshipSet)
  })

  it('throws when invalid SponsorAccount and Sponsee', function () {
    delete sponsorshipSet.SponsorAccount
    delete sponsorshipSet.Sponsee
    assertInvalid(
      sponsorshipSet,
      'SponsorshipSet: SponsorAccount or Sponsee must be set, but not both',
    )

    sponsorshipSet.SponsorAccount = 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo'
    sponsorshipSet.Sponsee = 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo'
    assertInvalid(
      sponsorshipSet,
      'SponsorshipSet: SponsorAccount and Sponsee cannot be both set',
    )
  })
})
