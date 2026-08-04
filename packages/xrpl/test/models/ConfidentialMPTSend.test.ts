import { validateConfidentialMPTSend } from '../../src/models/transactions/ConfidentialMPTSend'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateConfidentialMPTSend)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateConfidentialMPTSend, message)

const ACCOUNT = 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm'
const DESTINATION = 'rfkE1aSy9G8Upk4JssnwBxhEv5p4mn2KTy'
const MPT_ISSUANCE_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
// 33-byte compressed EC point (Pedersen commitment).
const EC_POINT = `02${'AB'.repeat(32)}`
// 66-byte ElGamal ciphertext (two compressed points).
const CIPHERTEXT = `02${'AB'.repeat(32)}03${'CD'.repeat(32)}`
// Fixed 946-byte ConfidentialMPTSend proof.
const PROOF = 'AB'.repeat(946)
const CREDENTIAL_ID =
  'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A'

/**
 * ConfidentialMPTSend Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('ConfidentialMPTSend', function () {
  it(`verifies valid ConfidentialMPTSend with all fields`, function () {
    assertValid({
      TransactionType: 'ConfidentialMPTSend',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      Destination: DESTINATION,
      DestinationTag: 12345,
      SenderEncryptedAmount: CIPHERTEXT,
      DestinationEncryptedAmount: CIPHERTEXT,
      IssuerEncryptedAmount: CIPHERTEXT,
      AuditorEncryptedAmount: CIPHERTEXT,
      ZKProof: PROOF,
      AmountCommitment: EC_POINT,
      BalanceCommitment: EC_POINT,
      CredentialIDs: [CREDENTIAL_ID],
    })
  })

  it(`verifies valid ConfidentialMPTSend with only required fields`, function () {
    assertValid({
      TransactionType: 'ConfidentialMPTSend',
      Account: ACCOUNT,
      MPTokenIssuanceID: MPT_ISSUANCE_ID,
      Destination: DESTINATION,
      SenderEncryptedAmount: CIPHERTEXT,
      DestinationEncryptedAmount: CIPHERTEXT,
      IssuerEncryptedAmount: CIPHERTEXT,
      ZKProof: PROOF,
      AmountCommitment: EC_POINT,
      BalanceCommitment: EC_POINT,
    })
  })

  it(`throws w/ missing Destination`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTSend',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        SenderEncryptedAmount: CIPHERTEXT,
        DestinationEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        ZKProof: PROOF,
        AmountCommitment: EC_POINT,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTSend: missing field Destination',
    )
  })

  it(`throws w/ missing SenderEncryptedAmount`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTSend',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Destination: DESTINATION,
        DestinationEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        ZKProof: PROOF,
        AmountCommitment: EC_POINT,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTSend: missing field SenderEncryptedAmount',
    )
  })

  it(`throws w/ missing AmountCommitment`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTSend',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Destination: DESTINATION,
        SenderEncryptedAmount: CIPHERTEXT,
        DestinationEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        ZKProof: PROOF,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTSend: missing field AmountCommitment',
    )
  })

  it(`throws w/ missing ZKProof`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTSend',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Destination: DESTINATION,
        SenderEncryptedAmount: CIPHERTEXT,
        DestinationEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        AmountCommitment: EC_POINT,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTSend: missing field ZKProof',
    )
  })

  it(`throws w/ invalid Destination`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTSend',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Destination: 'not-an-address',
        SenderEncryptedAmount: CIPHERTEXT,
        DestinationEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        ZKProof: PROOF,
        AmountCommitment: EC_POINT,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTSend: invalid field Destination',
    )
  })

  it(`throws w/ wrong-length DestinationEncryptedAmount`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTSend',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Destination: DESTINATION,
        SenderEncryptedAmount: CIPHERTEXT,
        // 33-byte EC point where a 66-byte ciphertext is required.
        DestinationEncryptedAmount: EC_POINT,
        IssuerEncryptedAmount: CIPHERTEXT,
        ZKProof: PROOF,
        AmountCommitment: EC_POINT,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTSend: invalid field DestinationEncryptedAmount',
    )
  })

  it(`throws w/ wrong-length AmountCommitment`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTSend',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Destination: DESTINATION,
        SenderEncryptedAmount: CIPHERTEXT,
        DestinationEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        ZKProof: PROOF,
        // 66-byte value where a 33-byte EC point is required.
        AmountCommitment: CIPHERTEXT,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTSend: invalid field AmountCommitment',
    )
  })

  it(`throws w/ invalid DestinationTag`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTSend',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Destination: DESTINATION,
        DestinationTag: 'not-a-number',
        SenderEncryptedAmount: CIPHERTEXT,
        DestinationEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        ZKProof: PROOF,
        AmountCommitment: EC_POINT,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTSend: invalid field DestinationTag',
    )
  })

  it(`throws w/ wrong-length ZKProof`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTSend',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Destination: DESTINATION,
        SenderEncryptedAmount: CIPHERTEXT,
        DestinationEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        // A 64-byte proof where the fixed 946-byte send proof is required.
        ZKProof: 'AB'.repeat(64),
        AmountCommitment: EC_POINT,
        BalanceCommitment: EC_POINT,
      },
      'ConfidentialMPTSend: invalid field ZKProof',
    )
  })

  it(`throws w/ non-array CredentialIDs`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTSend',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Destination: DESTINATION,
        SenderEncryptedAmount: CIPHERTEXT,
        DestinationEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        ZKProof: PROOF,
        AmountCommitment: EC_POINT,
        BalanceCommitment: EC_POINT,
        CredentialIDs: CREDENTIAL_ID,
      },
      'ConfidentialMPTSend: Credentials must be an array',
    )
  })

  it(`throws w/ non-string CredentialIDs element`, function () {
    assertInvalid(
      {
        TransactionType: 'ConfidentialMPTSend',
        Account: ACCOUNT,
        MPTokenIssuanceID: MPT_ISSUANCE_ID,
        Destination: DESTINATION,
        SenderEncryptedAmount: CIPHERTEXT,
        DestinationEncryptedAmount: CIPHERTEXT,
        IssuerEncryptedAmount: CIPHERTEXT,
        ZKProof: PROOF,
        AmountCommitment: EC_POINT,
        BalanceCommitment: EC_POINT,
        CredentialIDs: [12345],
      },
      'ConfidentialMPTSend: Invalid Credentials ID list format',
    )
  })
})
