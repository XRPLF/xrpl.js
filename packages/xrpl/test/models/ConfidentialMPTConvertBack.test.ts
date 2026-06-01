import { validateConfidentialMPTConvertBack } from '../../src/models/transactions/ConfidentialMPTConvertBack'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateConfidentialMPTConvertBack)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateConfidentialMPTConvertBack, message)

const ACCOUNT = 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm'
const MPT_ISSUANCE_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
// 33-byte compressed EC point (Pedersen commitment).
const EC_POINT = `02${'AB'.repeat(32)}`
// 66-byte ElGamal ciphertext (two compressed points).
const CIPHERTEXT = `02${'AB'.repeat(32)}03${'CD'.repeat(32)}`
// 32-byte scalar blinding factor.
const BLINDING = 'AB'.repeat(32)
const PROOF = 'AB'.repeat(408)

/**
 * ConfidentialMPTConvertBack Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ConfidentialMPTConvertBack', function () {
  it(`verifies valid ConfidentialMPTConvertBack with all fields`, function () {
    assertValid({
      TransactionType: 'ConfidentialMPTConvertBack',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '100',
      HolderEncryptedAmount: CIPHERTEXT,
      IssuerEncryptedAmount: CIPHERTEXT,
      AuditorEncryptedAmount: CIPHERTEXT,
      BlindingFactor: BLINDING,
      ZKProof: PROOF,
      BalanceCommitment: EC_POINT,
    })
  })

  it(`verifies valid ConfidentialMPTConvertBack with only required fields`, function () {
    assertValid({
      TransactionType: 'ConfidentialMPTConvertBack',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '100',
      HolderEncryptedAmount: CIPHERTEXT,
      IssuerEncryptedAmount: CIPHERTEXT,
      BlindingFactor: BLINDING,
      ZKProof: PROOF,
      BalanceCommitment: EC_POINT,
    })
  })

  it(`throws w/ missing ZKProof`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvertBack',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTConvertBack: missing field ZKProof',
    )
  })

  it(`throws w/ missing BalanceCommitment`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvertBack',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
        ZKProof: PROOF,
      },
      'ConfidentialMPTConvertBack: missing field BalanceCommitment',
    )
  })

  it(`throws w/ missing IssuerEncryptedAmount`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvertBack',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        HolderEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
        ZKProof: PROOF,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTConvertBack: missing field IssuerEncryptedAmount',
    )
  })

  it(`throws w/ wrong-length BalanceCommitment`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvertBack',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
        ZKProof: PROOF,
        // 66-byte value where a 33-byte EC point is required.
        BalanceCommitment: CIPHERTEXT,
      },
      'ConfidentialMPTConvertBack: invalid field BalanceCommitment',
    )
  })

  it(`throws w/ wrong-length AuditorEncryptedAmount`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvertBack',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        // 33-byte value where a 66-byte ciphertext is required.
        AuditorEncryptedAmount: EC_POINT,
        BlindingFactor: BLINDING,
        ZKProof: PROOF,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTConvertBack: invalid field AuditorEncryptedAmount',
    )
  })
})
