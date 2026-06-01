import { validateConfidentialMPTMergeInbox } from '../../src/models/transactions/ConfidentialMPTMergeInbox'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateConfidentialMPTMergeInbox)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateConfidentialMPTMergeInbox, message)

const ACCOUNT = 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm'
const MPT_ISSUANCE_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'

/**
 * ConfidentialMPTMergeInbox Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ConfidentialMPTMergeInbox', function () {
  it(`verifies valid ConfidentialMPTMergeInbox`, function () {
    assertValid({
      TransactionType: 'ConfidentialMPTMergeInbox',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
    })
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTMergeInbox',
        Account: ACCOUNT,
      },
      'ConfidentialMPTMergeInbox: missing field MPTokenIssuanceID',
    )
  })

  it(`throws w/ non-string MPTokenIssuanceID`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTMergeInbox',
        Account: ACCOUNT,
        MPTokenIssuanceID: 12345,
      },
      'ConfidentialMPTMergeInbox: invalid field MPTokenIssuanceID',
    )
  })
})
