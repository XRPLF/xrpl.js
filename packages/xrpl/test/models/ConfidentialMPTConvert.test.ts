import { validateConfidentialMPTConvert } from '../../src/models/transactions/ConfidentialMPTConvert'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateConfidentialMPTConvert)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateConfidentialMPTConvert, message)

const ACCOUNT = 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm'
const MPT_ISSUANCE_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
// An issuance whose embedded issuer IS ACCOUNT — the issuer may not convert.
const ISSUER_MPT_ID = '000004C40596915CFDEEE3A695B3EFD6BDA9AC788A368B7B'
// 33-byte compressed EC point (encryption key).
const EC_POINT = `02${'AB'.repeat(32)}`
// 66-byte ElGamal ciphertext (two compressed points).
const CIPHERTEXT = `02${'AB'.repeat(32)}03${'CD'.repeat(32)}`
// 32-byte scalar blinding factor.
const BLINDING = 'AB'.repeat(32)
const PROOF = 'AB'.repeat(64)

/**
 * ConfidentialMPTConvert Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ConfidentialMPTConvert', function () {
  it(`verifies valid ConfidentialMPTConvert with all fields`, function () {
    assertValid({
      TransactionType: 'ConfidentialMPTConvert',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '100',
      HolderEncryptionKey: EC_POINT,
      HolderEncryptedAmount: CIPHERTEXT,
      IssuerEncryptedAmount: CIPHERTEXT,
      AuditorEncryptedAmount: CIPHERTEXT,
      BlindingFactor: BLINDING,
      ZKProof: PROOF,
    })
  })

  it(`verifies valid ConfidentialMPTConvert with only required fields`, function () {
    assertValid({
      TransactionType: 'ConfidentialMPTConvert',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '100',
      HolderEncryptedAmount: CIPHERTEXT,
      IssuerEncryptedAmount: CIPHERTEXT,
      BlindingFactor: BLINDING,
    })
  })

  it(`throws when the issuer converts its own issuance`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTokenIssuanceID: ISSUER_MPT_ID,
        MPTAmount: '100',
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
      },
      'ConfidentialMPTConvert: the issuer cannot convert its own issuance',
    )
  })

  it(`throws w/ missing MPTokenIssuanceID`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTAmount: '100',
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
      },
      'ConfidentialMPTConvert: missing field MPTokenIssuanceID',
    )
  })

  it(`throws w/ missing MPTAmount`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
      },
      'ConfidentialMPTConvert: missing field MPTAmount',
    )
  })

  it(`throws w/ missing HolderEncryptedAmount`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
      },
      'ConfidentialMPTConvert: missing field HolderEncryptedAmount',
    )
  })

  it(`throws w/ missing BlindingFactor`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
      },
      'ConfidentialMPTConvert: missing field BlindingFactor',
    )
  })

  it(`throws w/ wrong-length HolderEncryptedAmount`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        // 33-byte EC point where a 66-byte ciphertext is required.
        HolderEncryptedAmount: EC_POINT,
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
      },
      'ConfidentialMPTConvert: invalid field HolderEncryptedAmount',
    )
  })

  it(`throws w/ wrong-length BlindingFactor`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        // 33-byte value where a 32-byte scalar is required.
        BlindingFactor: EC_POINT,
      },
      'ConfidentialMPTConvert: invalid field BlindingFactor',
    )
  })

  it(`throws w/ wrong-length HolderEncryptionKey`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        // 66-byte value where a 33-byte EC point is required.
        HolderEncryptionKey: CIPHERTEXT,
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
      },
      'ConfidentialMPTConvert: invalid field HolderEncryptionKey',
    )
  })

  it(`throws w/ non-hex IssuerEncryptedAmount`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: `ZZ${'AB'.repeat(65)}`,
        BlindingFactor: BLINDING,
      },
      'ConfidentialMPTConvert: invalid field IssuerEncryptedAmount',
    )
  })

  it(`throws w/ HolderEncryptionKey but no ZKProof`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        HolderEncryptionKey: EC_POINT,
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
      },
      'ConfidentialMPTConvert: set HolderEncryptionKey and ZKProof together',
    )
  })

  it(`throws w/ ZKProof but no HolderEncryptionKey`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '100',
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
        ZKProof: PROOF,
      },
      'ConfidentialMPTConvert: set HolderEncryptionKey and ZKProof together',
    )
  })

  it(`allows a zero MPTAmount (holder-key registration)`, function () {
    assertValid({
      TransactionType: 'ConfidentialMPTConvert',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      MPTAmount: '0',
      HolderEncryptedAmount: CIPHERTEXT,
      IssuerEncryptedAmount: CIPHERTEXT,
      BlindingFactor: BLINDING,
    })
  })

  it(`throws w/ MPTAmount out of range`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTConvert',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        MPTAmount: '9223372036854775808',
        HolderEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        BlindingFactor: BLINDING,
      },
      'ConfidentialMPTConvert: MPTAmount out of range',
    )
  })
})
