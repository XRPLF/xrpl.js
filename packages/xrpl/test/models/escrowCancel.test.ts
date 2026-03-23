import { validateEscrowCancel } from '../../src/models/transactions/escrowCancel'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateEscrowCancel)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateEscrowCancel, message)

/**
 * Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('EscrowCancel', function () {
  let cancel: any

  beforeEach(function () {
    cancel = {
      TransactionType: 'EscrowCancel',
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      OfferSequence: 7,
    }
  })

  it(`Valid EscrowCancel`, function () {
    assertValid(cancel)
  })

  it(`Valid EscrowCancel with string OfferSequence`, function () {
    cancel.OfferSequence = '7'

    assertValid(cancel)
  })

  it(`Invalid EscrowCancel missing owner`, function () {
    delete cancel.Owner

    assertInvalid(cancel, 'EscrowCancel: missing field Owner')
  })

  it(`Invalid EscrowCancel missing offerSequence`, function () {
    delete cancel.OfferSequence

    assertInvalid(cancel, 'EscrowCancel: missing OfferSequence')
  })

  it(`Invalid Owner`, function () {
    cancel.Owner = 10

    assertInvalid(cancel, 'EscrowCancel: invalid field Owner')
  })

  it(`Invalid OfferSequence`, function () {
    cancel.OfferSequence = 'random'

    assertInvalid(cancel, 'EscrowCancel: OfferSequence must be a number')
  })
})
