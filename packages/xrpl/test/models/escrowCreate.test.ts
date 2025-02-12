import { validateEscrowCreate } from '../../src/models/transactions/escrowCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateEscrowCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateEscrowCreate, message)

/**
 * EscrowCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('EscrowCreate', function () {
  let escrow: any

  beforeEach(function () {
    escrow = {
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      TransactionType: 'EscrowCreate',
      Amount: '10000',
      Destination: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
      CancelAfter: 533257958,
      FinishAfter: 533171558,
      Condition:
        'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100',
      DestinationTag: 23480,
      SourceTag: 11747,
    }
  })

  it(`verifies valid EscrowCreate`, function () {
    assertValid(escrow)
  })

  it(`Missing amount`, function () {
    delete escrow.Amount

    assertInvalid(escrow, 'EscrowCreate: missing field Amount')
  })

  it(`Missing destination`, function () {
    delete escrow.Destination

    assertInvalid(escrow, 'EscrowCreate: missing field Destination')
  })

  it(`throws w/ invalid Destination`, function () {
    escrow.Destination = 10

    assertInvalid(escrow, 'EscrowCreate: invalid field Destination')
  })

  it(`throws w/ invalid Amount`, function () {
    escrow.Amount = 1000

    assertInvalid(escrow, 'EscrowCreate: Amount must be a string')
  })

  it(`invalid CancelAfter`, function () {
    escrow.CancelAfter = '100'

    assertInvalid(escrow, 'EscrowCreate: CancelAfter must be a number')
  })

  it(`invalid FinishAfter`, function () {
    escrow.FinishAfter = '1000'

    assertInvalid(escrow, 'EscrowCreate: FinishAfter must be a number')
  })

  it(`invalid Condition`, function () {
    escrow.Condition = 0x141243

    assertInvalid(escrow, 'EscrowCreate: Condition must be a string')
  })

  it(`invalid DestinationTag`, function () {
    escrow.DestinationTag = '100'

    assertInvalid(escrow, 'EscrowCreate: invalid field DestinationTag')
  })

  it(`Missing both CancelAfter and FinishAfter`, function () {
    delete escrow.CancelAfter
    delete escrow.FinishAfter

    assertInvalid(
      escrow,
      'EscrowCreate: Either CancelAfter or FinishAfter must be specified',
    )
  })

  it(`Missing both Condition and FinishAfter`, function () {
    delete escrow.Condition
    delete escrow.FinishAfter

    assertInvalid(
      escrow,
      'EscrowCreate: Either Condition or FinishAfter must be specified',
    )
  })
})
