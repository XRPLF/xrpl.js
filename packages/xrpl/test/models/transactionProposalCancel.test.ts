import { validateTransactionProposalCancel } from '../../src/models/transactions/transactionProposalCancel'
import { registerTransactionTypes } from '../registerTransactionTypes'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateTransactionProposalCancel)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateTransactionProposalCancel, message)

/**
 * TransactionProposalCancel Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('TransactionProposalCancel', function () {
  registerTransactionTypes(['TransactionProposalCancel'])

  let tx: any

  beforeEach(function () {
    tx = {
      TransactionType: 'TransactionProposalCancel',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      ProposalID:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
    }
  })

  it('verifies valid TransactionProposalCancel', function () {
    assertValid(tx)
  })

  it('throws w/ missing ProposalID', function () {
    delete tx.ProposalID
    assertInvalid(tx, 'TransactionProposalCancel: missing field ProposalID')
  })

  it('throws w/ non-string ProposalID', function () {
    tx.ProposalID = 7
    assertInvalid(tx, 'TransactionProposalCancel: invalid field ProposalID')
  })

  it('throws w/ a ProposalID that is not 32 bytes of hex', function () {
    tx.ProposalID = 'DB303FC1'
    assertInvalid(tx, 'TransactionProposalCancel: invalid field ProposalID')
  })

  it('throws w/ a zero ProposalID', function () {
    tx.ProposalID = '0'.repeat(64)
    assertInvalid(tx, 'TransactionProposalCancel: ProposalID must not be zero')
  })
})
