import { validateEscrowFinish } from '../../src/models/transactions/escrowFinish'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateEscrowFinish)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateEscrowFinish, message)

/**
 * EscrowFinish Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('EscrowFinish', function () {
  let escrow: any

  beforeEach(function () {
    escrow = {
      Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      TransactionType: 'EscrowFinish',
      Owner: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
      OfferSequence: 7,
      Condition:
        'A0258020E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855810100',
      Fulfillment: 'A0028000',
      CredentialIDs: [
        'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A',
      ],
    }
  })
  it(`verifies valid EscrowFinish`, function () {
    assertValid(escrow)
  })

  it(`verifies valid EscrowFinish w/o optional`, function () {
    escrow.Condition = undefined
    escrow.Fulfillment = undefined
    escrow.CredentialIDs = undefined

    assertValid(escrow)
  })

  it(`verifies valid EscrowFinish w/string OfferSequence`, function () {
    escrow.OfferSequence = '7'

    assertValid(escrow)
  })

  it(`throws w/ invalid Owner`, function () {
    escrow.Owner = 0x15415253

    assertInvalid(escrow, 'EscrowFinish: invalid field Owner')
  })

  it(`throws w/ invalid OfferSequence`, function () {
    escrow.OfferSequence = 'random'

    assertInvalid(escrow, 'EscrowFinish: OfferSequence must be a number')
  })

  it(`throws w/ invalid Condition`, function () {
    escrow.Condition = 10

    assertInvalid(escrow, 'EscrowFinish: Condition must be a string')
  })

  it(`throws w/ invalid Fulfillment`, function () {
    escrow.Fulfillment = 0x142341

    assertInvalid(escrow, 'EscrowFinish: Fulfillment must be a string')
  })

  it(`throws w/ non-array CredentialIDs`, function () {
    escrow.CredentialIDs =
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A'

    const errorMessage = 'EscrowFinish: Credentials must be an array'

    assertInvalid(escrow, errorMessage)
  })

  it(`throws CredentialIDs length exceeds max length`, function () {
    escrow.CredentialIDs = [
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66B',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66C',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66D',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66E',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66F',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F660',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F661',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage =
      'EscrowFinish: Credentials length cannot exceed 8 elements'

    assertInvalid(escrow, errorMessage)
  })

  it(`throws w/ empty CredentialIDs`, function () {
    escrow.CredentialIDs = []

    const errorMessage = 'EscrowFinish: Credentials cannot be an empty array'

    assertInvalid(escrow, errorMessage)
  })

  it(`throws w/ non-string CredentialIDs`, function () {
    escrow.CredentialIDs = [
      123123,
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage = 'EscrowFinish: Invalid Credentials ID list format'

    assertInvalid(escrow, errorMessage)
  })

  it(`throws w/ duplicate CredentialIDs`, function () {
    escrow.CredentialIDs = [
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
      'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F662',
    ]

    const errorMessage =
      'EscrowFinish: Credentials cannot contain duplicate elements'

    assertInvalid(escrow, errorMessage)
  })
})
