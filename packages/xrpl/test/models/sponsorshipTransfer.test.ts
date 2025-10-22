import { validateSponsorshipTransfer } from '../../src/models/transactions/sponsorshipTransfer'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateSponsorshipTransfer)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateSponsorshipTransfer, message)

/**
 * SponsorshipTransfer Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SponsorshipTransfer', function () {
  let sponsorshipTransfer: any

  beforeEach(function () {
    sponsorshipTransfer = {
      TransactionType: 'SponsorshipTransfer',
      Account: 'rUn84CUYbNjRoTQ6mSW7BVJPSVJNLb1QLo',
      ObjectID:
        'D88930B33C2B6831660BFD006D91FF100011AD4E67CBB78B460AF0A215103737',
    }
  })

  it('verifies valid SponsorshipTransfer', function () {
    assertValid(sponsorshipTransfer)
  })

  it('throws when ObjectID is invalid', function () {
    // 63 characters
    sponsorshipTransfer.ObjectID =
      'D88930B33C2B6831660BFD006D91FF100011AD4E67CBB78B460AF0A2151037'
    assertInvalid(
      sponsorshipTransfer,
      'SponsorshipTransfer: missing field ObjectID',
    )

    // empty string
    sponsorshipTransfer.ObjectID = ''
    assertInvalid(
      sponsorshipTransfer,
      'SponsorshipTransfer: ObjectID must be a valid ObjectID',
    )

    // invalid length
    sponsorshipTransfer.ObjectID =
      'D88930B33C2B6831660BFD006D91FF100011AD4E67CBB78B460AF0A215103737'
    assertInvalid(
      sponsorshipTransfer,
      'SponsorshipTransfer: ObjectID must be a valid ObjectID',
    )
  })
})
