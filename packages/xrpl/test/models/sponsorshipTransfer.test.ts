import { validateSponsorshipTransfer } from '../../src/models/transactions/sponsorshipTransfer'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateSponsorshipTransfer)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateSponsorshipTransfer, message)

const LEDGER_INDEX =
  'AED08CC1F50DD5F23A1948AF86153A3F3B7593E5EC77D65A02BB1B29E05AB6AF'

/**
 * SponsorshipTransfer Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('SponsorshipTransfer', function () {
  let sponsorshipTransferTx: any

  beforeEach(function () {
    sponsorshipTransferTx = {
      TransactionType: 'SponsorshipTransfer',
      Account: 'rN7n7otQDd6FczFgLdlqtyMVrn3HMfXoKk',
      LedgerIndex: LEDGER_INDEX,
      Fee: '12',
    } as any
  })

  it('verifies valid SponsorshipTransfer', function () {
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid SponsorshipTransfer with NewSponsor', function () {
    sponsorshipTransferTx.NewSponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid SponsorshipTransfer without NewSponsor (removes sponsorship)', function () {
    // NewSponsor is optional - omitting it removes sponsorship
    assertValid(sponsorshipTransferTx)
  })

  it('throws when LedgerIndex is missing', function () {
    delete sponsorshipTransferTx.LedgerIndex
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: missing field LedgerIndex',
    )
  })

  it('throws when LedgerIndex is not a string', function () {
    sponsorshipTransferTx.LedgerIndex = 123
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: LedgerIndex must be a string',
    )
  })

  it('throws when LedgerIndex is not 64 hex characters', function () {
    sponsorshipTransferTx.LedgerIndex = 'ABCD1234'
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: LedgerIndex must be a 64-character hexadecimal string',
    )
  })

  it('throws when LedgerIndex contains non-hex characters', function () {
    sponsorshipTransferTx.LedgerIndex =
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: LedgerIndex must be a 64-character hexadecimal string',
    )
  })

  it('throws when NewSponsor is not a string', function () {
    sponsorshipTransferTx.NewSponsor = 123
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: NewSponsor must be a string',
    )
  })

  it('throws when NewSponsor is not a valid account address', function () {
    sponsorshipTransferTx.NewSponsor = 'invalid_address'
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: NewSponsor must be a valid account address',
    )
  })

  it('throws when Account and NewSponsor are the same', function () {
    sponsorshipTransferTx.NewSponsor = sponsorshipTransferTx.Account
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: Account and NewSponsor cannot be the same',
    )
  })

  it('verifies valid SponsorshipTransfer with X-Address for NewSponsor', function () {
    sponsorshipTransferTx.NewSponsor =
      'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi'
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid SponsorshipTransfer with X-Address for Account', function () {
    sponsorshipTransferTx.Account =
      'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi'
    assertValid(sponsorshipTransferTx)
  })

  it('throws when both Account and NewSponsor are the same X-Address', function () {
    const xAddress = 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi'
    sponsorshipTransferTx.Account = xAddress
    sponsorshipTransferTx.NewSponsor = xAddress
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: Account and NewSponsor cannot be the same',
    )
  })

  it('verifies valid SponsorshipTransfer with lowercase hex LedgerIndex', function () {
    sponsorshipTransferTx.LedgerIndex =
      'aed08cc1f50dd5f23a1948af86153a3f3b7593e5ec77d65a02bb1b29e05ab6af'
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid SponsorshipTransfer with mixed case hex LedgerIndex', function () {
    sponsorshipTransferTx.LedgerIndex =
      'AeD08Cc1F50dD5f23A1948aF86153a3F3b7593E5eC77d65A02bB1b29E05aB6aF'
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid SponsorshipTransfer with all optional fields', function () {
    sponsorshipTransferTx.NewSponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
    sponsorshipTransferTx.Memos = [
      {
        Memo: {
          MemoData: '54657374',
        },
      },
    ]
    assertValid(sponsorshipTransferTx)
  })
})

