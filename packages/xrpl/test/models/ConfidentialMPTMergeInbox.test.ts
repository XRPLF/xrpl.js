import { validateConfidentialMPTMergeInbox } from '../../src/models/transactions/ConfidentialMPTMergeInbox'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateConfidentialMPTMergeInbox)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateConfidentialMPTMergeInbox, message)

const ACCOUNT = 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm'
const MPT_ISSUANCE_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
// An issuance whose embedded issuer IS ACCOUNT — the issuer may not merge.
const ISSUER_MPT_ID = '000004C40596915CFDEEE3A695B3EFD6BDA9AC788A368B7B'

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

  it(`throws when the issuer merges its own issuance`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTMergeInbox',
        Account: ACCOUNT,
        MPTokenIssuanceID: ISSUER_MPT_ID,
      },
      'ConfidentialMPTMergeInbox: the issuer cannot merge its own issuance',
    )
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
