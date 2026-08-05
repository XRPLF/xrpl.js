import { SponsorFlags } from '../../src/models/transactions/common'
import {
  SponsorshipTransferFlags,
  validateSponsorshipTransfer,
} from '../../src/models/transactions/sponsorshipTransfer'
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
      ObjectID: LEDGER_INDEX,
      // Default to End scenario
      Flags: SponsorshipTransferFlags.tfSponsorshipEnd,
      Fee: '12',
    } as any
  })

  it('verifies valid SponsorshipTransfer with tfSponsorshipEnd', function () {
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid SponsorshipTransfer with tfSponsorshipCreate and Sponsor', function () {
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
    sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
    sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorReserve
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid SponsorshipTransfer with tfSponsorshipReassign and Sponsor', function () {
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipReassign
    sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
    sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorReserve
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid SponsorshipTransfer without ObjectID (account-level sponsorship)', function () {
    delete sponsorshipTransferTx.ObjectID
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipEnd
    assertValid(sponsorshipTransferTx)
  })

  it('throws when tfSponsorshipCreate is missing SponsorFlags reserve bit', function () {
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
    sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
    sponsorshipTransferTx.SponsorSignature = {
      SigningPubKey:
        '02356E89059A75438887F9FEE2056A2890DB82A68353BE9C0C0C8F89C0018B37FC',
      TxnSignature:
        '3045022100D184EB4AE5956FF600E7536EE459345C7BBCF097A84CC61A93B9AF7197EDB98702201E' +
        'F0EBFB08929B1C1171B4D4B943774D6388B3B2F1F1E2F3E4F5F6F7F8F9FA',
    }
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: SponsorFlags must be present with the tfSponsorReserve bit set for tfSponsorshipCreate and tfSponsorshipReassign scenarios',
    )
  })

  it('throws when tfSponsorshipReassign has SponsorFlags without the reserve bit', function () {
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipReassign
    sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
    sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorFee
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: SponsorFlags must be present with the tfSponsorReserve bit set for tfSponsorshipCreate and tfSponsorshipReassign scenarios',
    )
  })

  it('throws when account-level tfSponsorshipCreate is missing SponsorSignature', function () {
    delete sponsorshipTransferTx.ObjectID
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
    sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
    sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorReserve
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: SponsorSignature is required for account-level tfSponsorshipCreate',
    )
  })

  it('throws when account-level tfSponsorshipReassign is missing SponsorSignature', function () {
    delete sponsorshipTransferTx.ObjectID
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipReassign
    sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
    sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorReserve
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: SponsorSignature is required for account-level tfSponsorshipCreate',
    )
  })

  it('verifies valid account-level tfSponsorshipCreate with SponsorSignature', function () {
    delete sponsorshipTransferTx.ObjectID
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
    sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
    sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorReserve
    sponsorshipTransferTx.SponsorSignature = {
      SigningPubKey:
        '02356E89059A75438887F9FEE2056A2890DB82A68353BE9C0C0C8F89C0018B37FC',
      TxnSignature:
        '3045022100D184EB4AE5956FF600E7536EE459345C7BBCF097A84CC61A93B9AF7197EDB98702201E' +
        'F0EBFB08929B1C1171B4D4B943774D6388B3B2F1F1E2F3E4F5F6F7F8F9FA',
    }
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid object-level tfSponsorshipCreate without SponsorSignature', function () {
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
    sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
    sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorReserve
    assertValid(sponsorshipTransferTx)
  })

  it('throws when ObjectID is not a string', function () {
    sponsorshipTransferTx.ObjectID = 123
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: ObjectID must be a string',
    )
  })

  it('throws when ObjectID is not 64 hex characters', function () {
    sponsorshipTransferTx.ObjectID = 'ABCD1234'
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: ObjectID must be a 64-character hexadecimal string',
    )
  })

  it('throws when ObjectID contains non-hex characters', function () {
    sponsorshipTransferTx.ObjectID =
      'ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: ObjectID must be a 64-character hexadecimal string',
    )
  })

  it('throws when Sponsor is not a string', function () {
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
    sponsorshipTransferTx.Sponsor = 123
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: Sponsor must be a string',
    )
  })

  it('throws when Sponsor is not a valid account address', function () {
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
    sponsorshipTransferTx.Sponsor = 'invalid_address'
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: Sponsor must be a valid account address',
    )
  })

  it('throws when Account and Sponsor are the same', function () {
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
    sponsorshipTransferTx.Sponsor = sponsorshipTransferTx.Account
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: Account and Sponsor cannot be the same',
    )
  })

  it('verifies valid SponsorshipTransfer with X-Address for Sponsor', function () {
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
    sponsorshipTransferTx.Sponsor =
      'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi'
    sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorReserve
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid SponsorshipTransfer with X-Address for Account', function () {
    sponsorshipTransferTx.Account =
      'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi'
    assertValid(sponsorshipTransferTx)
  })

  it('throws when both Account and Sponsor are the same X-Address', function () {
    const xAddress = 'XVLhHMPHU98es4dbozjVtdWzVrDjtV18pX8yuPT7y4xaEHi'
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
    sponsorshipTransferTx.Account = xAddress
    sponsorshipTransferTx.Sponsor = xAddress
    assertInvalid(
      sponsorshipTransferTx,
      'SponsorshipTransfer: Account and Sponsor cannot be the same',
    )
  })

  it('verifies valid SponsorshipTransfer with lowercase hex ObjectID', function () {
    sponsorshipTransferTx.ObjectID =
      'aed08cc1f50dd5f23a1948af86153a3f3b7593e5ec77d65a02bb1b29e05ab6af'
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid SponsorshipTransfer with mixed case hex ObjectID', function () {
    sponsorshipTransferTx.ObjectID =
      'AeD08Cc1F50dD5f23A1948aF86153a3F3b7593E5eC77d65A02bB1b29E05aB6aF'
    assertValid(sponsorshipTransferTx)
  })

  it('verifies valid SponsorshipTransfer with all optional fields', function () {
    sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipEnd
    sponsorshipTransferTx.Memos = [
      {
        Memo: {
          MemoData: '54657374',
        },
      },
    ]
    assertValid(sponsorshipTransferTx)
  })

  // Scenario Flag Tests
  describe('Scenario Flag Validation', function () {
    it('throws when no scenario flag is set', function () {
      // Remove the Flags field to test the validator
      delete sponsorshipTransferTx.Flags
      assertInvalid(
        sponsorshipTransferTx,
        'SponsorshipTransfer: must specify exactly one scenario flag (tfSponsorshipEnd, tfSponsorshipCreate, or tfSponsorshipReassign)',
      )
    })

    it('verifies valid SponsorshipTransfer with tfSponsorshipEnd flag', function () {
      sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipEnd
      // tfSponsorshipEnd should NOT have Sponsor field
      assertValid(sponsorshipTransferTx)
    })

    it('verifies valid SponsorshipTransfer with tfSponsorshipCreate flag and Sponsor', function () {
      sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
      sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
      sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorReserve
      assertValid(sponsorshipTransferTx)
    })

    it('verifies valid SponsorshipTransfer with tfSponsorshipReassign flag and Sponsor', function () {
      sponsorshipTransferTx.Flags =
        SponsorshipTransferFlags.tfSponsorshipReassign
      sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
      sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorReserve
      assertValid(sponsorshipTransferTx)
    })

    it('throws when tfSponsorshipEnd has Sponsor field present', function () {
      sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipEnd
      sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
      assertInvalid(
        sponsorshipTransferTx,
        'SponsorshipTransfer: Sponsor field must not be present for tfSponsorshipEnd scenario',
      )
    })

    it('throws when tfSponsorshipCreate missing Sponsor field', function () {
      sponsorshipTransferTx.Flags = SponsorshipTransferFlags.tfSponsorshipCreate
      // No Sponsor field
      assertInvalid(
        sponsorshipTransferTx,
        'SponsorshipTransfer: Sponsor field is required for tfSponsorshipCreate and tfSponsorshipReassign scenarios',
      )
    })

    it('throws when tfSponsorshipReassign missing Sponsor field', function () {
      sponsorshipTransferTx.Flags =
        SponsorshipTransferFlags.tfSponsorshipReassign
      // No Sponsor field
      assertInvalid(
        sponsorshipTransferTx,
        'SponsorshipTransfer: Sponsor field is required for tfSponsorshipCreate and tfSponsorshipReassign scenarios',
      )
    })

    it('throws when multiple scenario flags are set (tfSponsorshipEnd + tfSponsorshipCreate)', function () {
      /* eslint-disable no-bitwise -- Testing bitwise flag combinations */
      sponsorshipTransferTx.Flags =
        SponsorshipTransferFlags.tfSponsorshipEnd |
        SponsorshipTransferFlags.tfSponsorshipCreate
      /* eslint-enable no-bitwise */
      assertInvalid(
        sponsorshipTransferTx,
        'SponsorshipTransfer: cannot specify multiple scenario flags (tfSponsorshipEnd, tfSponsorshipCreate, tfSponsorshipReassign are mutually exclusive)',
      )
    })

    it('throws when multiple scenario flags are set (tfSponsorshipCreate + tfSponsorshipReassign)', function () {
      /* eslint-disable no-bitwise -- Testing bitwise flag combinations */
      sponsorshipTransferTx.Flags =
        SponsorshipTransferFlags.tfSponsorshipCreate |
        SponsorshipTransferFlags.tfSponsorshipReassign
      /* eslint-enable no-bitwise */
      assertInvalid(
        sponsorshipTransferTx,
        'SponsorshipTransfer: cannot specify multiple scenario flags (tfSponsorshipEnd, tfSponsorshipCreate, tfSponsorshipReassign are mutually exclusive)',
      )
    })

    it('throws when multiple scenario flags are set (tfSponsorshipEnd + tfSponsorshipReassign)', function () {
      /* eslint-disable no-bitwise -- Testing bitwise flag combinations */
      sponsorshipTransferTx.Flags =
        SponsorshipTransferFlags.tfSponsorshipEnd |
        SponsorshipTransferFlags.tfSponsorshipReassign
      /* eslint-enable no-bitwise */
      assertInvalid(
        sponsorshipTransferTx,
        'SponsorshipTransfer: cannot specify multiple scenario flags (tfSponsorshipEnd, tfSponsorshipCreate, tfSponsorshipReassign are mutually exclusive)',
      )
    })

    it('throws when all three scenario flags are set', function () {
      /* eslint-disable no-bitwise -- Testing bitwise flag combinations */
      sponsorshipTransferTx.Flags =
        SponsorshipTransferFlags.tfSponsorshipEnd |
        SponsorshipTransferFlags.tfSponsorshipCreate |
        SponsorshipTransferFlags.tfSponsorshipReassign
      /* eslint-enable no-bitwise */
      assertInvalid(
        sponsorshipTransferTx,
        'SponsorshipTransfer: cannot specify multiple scenario flags (tfSponsorshipEnd, tfSponsorshipCreate, tfSponsorshipReassign are mutually exclusive)',
      )
    })

    it('verifies valid SponsorshipTransfer with boolean tfSponsorshipEnd flag', function () {
      sponsorshipTransferTx.Flags = { tfSponsorshipEnd: true }
      assertValid(sponsorshipTransferTx)
    })

    it('verifies valid SponsorshipTransfer with boolean tfSponsorshipCreate flag', function () {
      sponsorshipTransferTx.Flags = { tfSponsorshipCreate: true }
      sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
      sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorReserve
      assertValid(sponsorshipTransferTx)
    })

    it('verifies valid SponsorshipTransfer with boolean tfSponsorshipReassign flag', function () {
      sponsorshipTransferTx.Flags = { tfSponsorshipReassign: true }
      sponsorshipTransferTx.Sponsor = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
      sponsorshipTransferTx.SponsorFlags = SponsorFlags.tfSponsorReserve
      assertValid(sponsorshipTransferTx)
    })
  })
})
