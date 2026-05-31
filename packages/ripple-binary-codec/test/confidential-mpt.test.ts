import { encode, decode } from '../src'

// Confidential MPT (XLS-0096) canonical field fixtures.
const ACCOUNT = 'r9LqNeG6qHxjeUocjvVki2XR35weJ9mZgQ'
const DESTINATION = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const ISSUANCE_ID = '000004C463C52827307480341125DA0577DEFC38405B0E3E'
// 33-byte compressed EC point (encryption keys, Pedersen commitments).
const EC_POINT = `02${'AB'.repeat(32)}`
// 66-byte ElGamal ciphertext (two compressed points).
const CIPHERTEXT = `02${'AB'.repeat(32)}03${'CD'.repeat(32)}`
// 32-byte scalar blinding factor (Hash256).
const BLINDING = 'AB'.repeat(32)
// Fixed-length zero-knowledge proofs.
const SEND_PROOF = 'AB'.repeat(946)
const CONVERT_BACK_PROOF = 'AB'.repeat(816)
const SCHNORR_PROOF = 'AB'.repeat(64)
const CREDENTIAL_ID =
  'EA85602C1B41F6F1F5E83C0E6B87142FB8957BD209469E4CC347BA2D0C26F66A'

/**
 * Assert that an object survives an `encode` → `decode` round-trip unchanged.
 *
 * The re-encode equality is representation-agnostic (proves encode/decode are
 * consistent inverses); the `toEqual` proves no field is silently dropped or
 * altered, given the inputs are already in canonical decoded form.
 *
 * @param obj - The transaction or ledger-entry object to round-trip.
 */
function assertRoundTrip(obj: Record<string, unknown>): void {
  const encoded = encode(obj)
  const decoded = decode(encoded)
  expect(encode(decoded)).toBe(encoded)
  expect(decoded).toEqual(obj)
}

describe('Confidential MPT (XLS-0096) binary codec', function () {
  it('round-trips ConfidentialMPTConvert (all fields)', function () {
    assertRoundTrip({
      TransactionType: 'ConfidentialMPTConvert',
      Account: ACCOUNT,
      Sequence: 1,
      MPTokenIssuanceID: ISSUANCE_ID,
      MPTAmount: '100',
      HolderEncryptionKey: EC_POINT,
      HolderEncryptedAmount: CIPHERTEXT,
      IssuerEncryptedAmount: CIPHERTEXT,
      AuditorEncryptedAmount: CIPHERTEXT,
      BlindingFactor: BLINDING,
      ZKProof: SCHNORR_PROOF,
    })
  })

  it('round-trips ConfidentialMPTConvertBack (all fields)', function () {
    assertRoundTrip({
      TransactionType: 'ConfidentialMPTConvertBack',
      Account: ACCOUNT,
      Sequence: 2,
      MPTokenIssuanceID: ISSUANCE_ID,
      MPTAmount: '250',
      HolderEncryptedAmount: CIPHERTEXT,
      IssuerEncryptedAmount: CIPHERTEXT,
      AuditorEncryptedAmount: CIPHERTEXT,
      BlindingFactor: BLINDING,
      ZKProof: CONVERT_BACK_PROOF,
      BalanceCommitment: EC_POINT,
    })
  })

  it('round-trips ConfidentialMPTSend (all fields)', function () {
    assertRoundTrip({
      TransactionType: 'ConfidentialMPTSend',
      Account: ACCOUNT,
      Sequence: 3,
      MPTokenIssuanceID: ISSUANCE_ID,
      Destination: DESTINATION,
      DestinationTag: 12345,
      SenderEncryptedAmount: CIPHERTEXT,
      DestinationEncryptedAmount: CIPHERTEXT,
      IssuerEncryptedAmount: CIPHERTEXT,
      AuditorEncryptedAmount: CIPHERTEXT,
      ZKProof: SEND_PROOF,
      AmountCommitment: EC_POINT,
      BalanceCommitment: EC_POINT,
      CredentialIDs: [CREDENTIAL_ID],
    })
  })

  it('round-trips ConfidentialMPTClawback (all fields)', function () {
    assertRoundTrip({
      TransactionType: 'ConfidentialMPTClawback',
      Account: ACCOUNT,
      Sequence: 4,
      MPTokenIssuanceID: ISSUANCE_ID,
      Holder: DESTINATION,
      MPTAmount: '100',
      ZKProof: SCHNORR_PROOF,
    })
  })

  it('round-trips ConfidentialMPTMergeInbox', function () {
    assertRoundTrip({
      TransactionType: 'ConfidentialMPTMergeInbox',
      Account: ACCOUNT,
      Sequence: 5,
      MPTokenIssuanceID: ISSUANCE_ID,
    })
  })

  it('round-trips an MPToken ledger entry with confidential fields', function () {
    assertRoundTrip({
      LedgerEntryType: 'MPToken',
      ConfidentialBalanceVersion: 7,
      ConfidentialBalanceInbox: CIPHERTEXT,
      ConfidentialBalanceSpending: CIPHERTEXT,
      IssuerEncryptedBalance: CIPHERTEXT,
      AuditorEncryptedBalance: CIPHERTEXT,
      HolderEncryptionKey: EC_POINT,
    })
  })

  it('round-trips an MPTokenIssuance ledger entry with confidential fields', function () {
    assertRoundTrip({
      LedgerEntryType: 'MPTokenIssuance',
      // Generic UInt64 fields round-trip in canonical 16-char hex form.
      ConfidentialOutstandingAmount: '0000000000012345',
      IssuerEncryptionKey: EC_POINT,
      AuditorEncryptionKey: EC_POINT,
    })
  })

  it('decodes tecBAD_PROOF in transaction metadata', function () {
    const meta = {
      TransactionResult: 'tecBAD_PROOF',
      TransactionIndex: 0,
      AffectedNodes: [],
    }
    expect(decode(encode(meta)).TransactionResult).toBe('tecBAD_PROOF')
  })
})
