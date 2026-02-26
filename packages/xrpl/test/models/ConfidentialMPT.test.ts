import { validateConfidentialMPTConvert } from '../../src/models/transactions/ConfidentialMPTConvert'
import { validateConfidentialMPTMergeInbox } from '../../src/models/transactions/ConfidentialMPTMergeInbox'
import { validateConfidentialMPTConvertBack } from '../../src/models/transactions/ConfidentialMPTConvertBack'
import { validateConfidentialMPTSend } from '../../src/models/transactions/ConfidentialMPTSend'
import { validateConfidentialMPTClawback } from '../../src/models/transactions/ConfidentialMPTClawback'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const MPT_ISSUANCE_ID =
  '0000000000000000000000000000000000000000000000000000000000000001'
const SAMPLE_HEX_66_BYTES = 'A'.repeat(132) // 66 bytes = 132 hex chars
const SAMPLE_ZK_PROOF = 'B'.repeat(200) // Sample ZK proof
const SAMPLE_COMMITMENT = 'C'.repeat(66) // Sample commitment

/**
 * ConfidentialMPTConvert Transaction Verification Testing.
 */
describe('ConfidentialMPTConvert', function () {
  const assertValid = (tx: any): void =>
    assertTxIsValid(tx, validateConfidentialMPTConvert)
  const assertInvalid = (tx: any, message: string): void =>
    assertTxValidationError(tx, validateConfidentialMPTConvert, message)

  it(`verifies valid ConfidentialMPTConvert`, function () {
    const validTx = {
      TransactionType: 'ConfidentialMPTConvert',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '1000',
      HolderEncryptedAmount: SAMPLE_HEX_66_BYTES,
      IssuerEncryptedAmount: SAMPLE_HEX_66_BYTES,
      BlindingFactor: SAMPLE_COMMITMENT,
    } as any

    assertValid(validTx)
  })

  it(`verifies valid ConfidentialMPTConvert with optional fields`, function () {
    const validTx = {
      TransactionType: 'ConfidentialMPTConvert',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '1000',
      HolderEncryptedAmount: SAMPLE_HEX_66_BYTES,
      IssuerEncryptedAmount: SAMPLE_HEX_66_BYTES,
      AuditorEncryptedAmount: SAMPLE_HEX_66_BYTES,
      BlindingFactor: SAMPLE_COMMITMENT,
      HolderElGamalPublicKey: SAMPLE_HEX_66_BYTES,
      ZKProof: SAMPLE_ZK_PROOF,
    } as any

    assertValid(validTx)
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTConvert',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTAmount: '1000',
      HolderEncryptedAmount: SAMPLE_HEX_66_BYTES,
      IssuerEncryptedAmount: SAMPLE_HEX_66_BYTES,
      BlindingFactor: SAMPLE_COMMITMENT,
      ZKProof: SAMPLE_ZK_PROOF,
      BalanceCommitment: SAMPLE_COMMITMENT,
    } as any

    assertInvalid(
      invalid,
      'ConfidentialMPTConvert: missing field MPTokenIssuanceID',
    )
  })

  it(`throws w/ missing MPTAmount`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTConvert',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      HolderEncryptedAmount: SAMPLE_HEX_66_BYTES,
      IssuerEncryptedAmount: SAMPLE_HEX_66_BYTES,
      BlindingFactor: SAMPLE_COMMITMENT,
    } as any

    assertInvalid(invalid, 'ConfidentialMPTConvert: missing field MPTAmount')
  })

  it(`throws w/ missing BlindingFactor`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTConvert',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '1000',
      HolderEncryptedAmount: SAMPLE_HEX_66_BYTES,
      IssuerEncryptedAmount: SAMPLE_HEX_66_BYTES,
    } as any

    assertInvalid(
      invalid,
      'ConfidentialMPTConvert: missing field BlindingFactor',
    )
  })
})

/**
 * ConfidentialMPTMergeInbox Transaction Verification Testing.
 */
describe('ConfidentialMPTMergeInbox', function () {
  const assertValid = (tx: any): void =>
    assertTxIsValid(tx, validateConfidentialMPTMergeInbox)
  const assertInvalid = (tx: any, message: string): void =>
    assertTxValidationError(tx, validateConfidentialMPTMergeInbox, message)

  it(`verifies valid ConfidentialMPTMergeInbox`, function () {
    const validTx = {
      TransactionType: 'ConfidentialMPTMergeInbox',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
    } as any

    assertValid(validTx)
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTMergeInbox',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
    } as any

    assertInvalid(
      invalid,
      'ConfidentialMPTMergeInbox: missing field MPTokenIssuanceID',
    )
  })

  it(`throws w/ invalid MPTokenIssuanceID type`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTMergeInbox',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: 12345,
    } as any

    assertInvalid(
      invalid,
      'ConfidentialMPTMergeInbox: invalid field MPTokenIssuanceID',
    )
  })
})

/**
 * ConfidentialMPTConvertBack Transaction Verification Testing.
 */
describe('ConfidentialMPTConvertBack', function () {
  const assertValid = (tx: any): void =>
    assertTxIsValid(tx, validateConfidentialMPTConvertBack)
  const assertInvalid = (tx: any, message: string): void =>
    assertTxValidationError(tx, validateConfidentialMPTConvertBack, message)

  it(`verifies valid ConfidentialMPTConvertBack`, function () {
    const validTx = {
      TransactionType: 'ConfidentialMPTConvertBack',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '1000',
      HolderEncryptedAmount: SAMPLE_HEX_66_BYTES,
      IssuerEncryptedAmount: SAMPLE_HEX_66_BYTES,
      BlindingFactor: SAMPLE_COMMITMENT,
      ZKProof: SAMPLE_ZK_PROOF,
      BalanceCommitment: SAMPLE_COMMITMENT,
    } as any

    assertValid(validTx)
  })

  it(`throws w/ missing required fields`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTConvertBack',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
    } as any

    assertInvalid(
      invalid,
      'ConfidentialMPTConvertBack: missing field MPTAmount',
    )
  })
})

/**
 * ConfidentialMPTSend Transaction Verification Testing.
 */
describe('ConfidentialMPTSend', function () {
  const assertValid = (tx: any): void =>
    assertTxIsValid(tx, validateConfidentialMPTSend)
  const assertInvalid = (tx: any, message: string): void =>
    assertTxValidationError(tx, validateConfidentialMPTSend, message)

  it(`verifies valid ConfidentialMPTSend`, function () {
    const validTx = {
      TransactionType: 'ConfidentialMPTSend',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      SenderEncryptedAmount: SAMPLE_HEX_66_BYTES,
      DestinationEncryptedAmount: SAMPLE_HEX_66_BYTES,
      IssuerEncryptedAmount: SAMPLE_HEX_66_BYTES,
      ZKProof: SAMPLE_ZK_PROOF,
      AmountCommitment: SAMPLE_COMMITMENT,
      BalanceCommitment: SAMPLE_COMMITMENT,
    } as any

    assertValid(validTx)
  })

  it(`verifies valid ConfidentialMPTSend with optional fields`, function () {
    const validTx = {
      TransactionType: 'ConfidentialMPTSend',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Destination: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      SenderEncryptedAmount: SAMPLE_HEX_66_BYTES,
      DestinationEncryptedAmount: SAMPLE_HEX_66_BYTES,
      IssuerEncryptedAmount: SAMPLE_HEX_66_BYTES,
      AuditorEncryptedAmount: SAMPLE_HEX_66_BYTES,
      ZKProof: SAMPLE_ZK_PROOF,
      AmountCommitment: SAMPLE_COMMITMENT,
      BalanceCommitment: SAMPLE_COMMITMENT,
      CredentialIDs: [
        '0000000000000000000000000000000000000000000000000000000000000002',
      ],
    } as any

    assertValid(validTx)
  })

  it(`throws w/ missing Destination`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTSend',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      SenderEncryptedAmount: SAMPLE_HEX_66_BYTES,
      DestinationEncryptedAmount: SAMPLE_HEX_66_BYTES,
      IssuerEncryptedAmount: SAMPLE_HEX_66_BYTES,
      ZKProof: SAMPLE_ZK_PROOF,
      AmountCommitment: SAMPLE_COMMITMENT,
      BalanceCommitment: SAMPLE_COMMITMENT,
    } as any

    assertInvalid(invalid, 'ConfidentialMPTSend: missing field Destination')
  })

  it(`throws w/ invalid Destination`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTSend',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Destination: 'invalid_address',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      SenderEncryptedAmount: SAMPLE_HEX_66_BYTES,
      DestinationEncryptedAmount: SAMPLE_HEX_66_BYTES,
      IssuerEncryptedAmount: SAMPLE_HEX_66_BYTES,
      ZKProof: SAMPLE_ZK_PROOF,
      AmountCommitment: SAMPLE_COMMITMENT,
      BalanceCommitment: SAMPLE_COMMITMENT,
    } as any

    assertInvalid(invalid, 'ConfidentialMPTSend: invalid field Destination')
  })
})

/**
 * ConfidentialMPTClawback Transaction Verification Testing.
 */
describe('ConfidentialMPTClawback', function () {
  const assertValid = (tx: any): void =>
    assertTxIsValid(tx, validateConfidentialMPTClawback)
  const assertInvalid = (tx: any, message: string): void =>
    assertTxValidationError(tx, validateConfidentialMPTClawback, message)

  it(`verifies valid ConfidentialMPTClawback`, function () {
    const validTx = {
      TransactionType: 'ConfidentialMPTClawback',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '1000',
      ZKProof: SAMPLE_ZK_PROOF,
    } as any

    assertValid(validTx)
  })

  it(`throws w/ missing Holder`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTClawback',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '1000',
      ZKProof: SAMPLE_ZK_PROOF,
    } as any

    assertInvalid(invalid, 'ConfidentialMPTClawback: missing field Holder')
  })

  it(`throws w/ invalid Holder`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTClawback',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'not_a_valid_address',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '1000',
      ZKProof: SAMPLE_ZK_PROOF,
    } as any

    assertInvalid(invalid, 'ConfidentialMPTClawback: invalid field Holder')
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTClawback',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
      MPTAmount: '1000',
      ZKProof: SAMPLE_ZK_PROOF,
    } as any

    assertInvalid(
      invalid,
      'ConfidentialMPTClawback: missing field MPTokenIssuanceID',
    )
  })

  it(`throws w/ missing MPTAmount`, function () {
    const invalid = {
      TransactionType: 'ConfidentialMPTClawback',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Holder: 'rPMh7Pi9ct699iZUTWaytJUoHcJ7cgyziK',
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      ZKProof: SAMPLE_ZK_PROOF,
    } as any

    assertInvalid(invalid, 'ConfidentialMPTClawback: missing field MPTAmount')
  })
})
