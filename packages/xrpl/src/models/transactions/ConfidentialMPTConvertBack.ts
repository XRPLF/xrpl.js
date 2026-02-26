import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
  validateOptionalField,
} from './common'

/**
 * The ConfidentialMPTConvertBack transaction converts confidential
 * (encrypted) MPT balance back into public MPT balance.
 *
 * This requires a zero-knowledge proof (ZKProof) to verify that the
 * holder actually has sufficient confidential balance without revealing
 * the actual amounts.
 */
export interface ConfidentialMPTConvertBack extends BaseTransaction {
  TransactionType: 'ConfidentialMPTConvertBack'

  /**
   * Identifies the MPTokenIssuance for which to convert balance.
   */
  MPTokenIssuanceID: string

  /**
   * The amount of MPT to convert from confidential to public balance.
   * This is a cleartext amount as a string.
   */
  MPTAmount: string

  /**
   * The encrypted amount being deducted from the holder's confidential balance.
   * 66 bytes (two 33-byte compressed EC points), hex-encoded.
   */
  HolderEncryptedAmount: string

  /**
   * The encrypted amount for the issuer's tracking purposes.
   * 66 bytes (two 33-byte compressed EC points), hex-encoded.
   */
  IssuerEncryptedAmount: string

  /**
   * Optional. The encrypted amount for the auditor (if configured).
   * 66 bytes (two 33-byte compressed EC points), hex-encoded.
   */
  AuditorEncryptedAmount?: string

  /**
   * The blinding factor used in the Pedersen commitment.
   * Required for proof verification.
   */
  BlindingFactor: string

  /**
   * Zero-knowledge proof proving the holder has sufficient confidential
   * balance and that the conversion is valid.
   */
  ZKProof: string

  /**
   * The Pedersen commitment to the holder's remaining balance after conversion.
   * Required for balance verification.
   */
  BalanceCommitment: string
}

/**
 * Verify the form and type of a ConfidentialMPTConvertBack at runtime.
 *
 * @param tx - A ConfidentialMPTConvertBack Transaction.
 * @throws When the ConfidentialMPTConvertBack is Malformed.
 */
export function validateConfidentialMPTConvertBack(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  validateRequiredField(tx, 'MPTAmount', isString)
  validateRequiredField(tx, 'HolderEncryptedAmount', isString)
  validateRequiredField(tx, 'IssuerEncryptedAmount', isString)
  validateRequiredField(tx, 'BlindingFactor', isString)
  validateRequiredField(tx, 'ZKProof', isString)
  validateRequiredField(tx, 'BalanceCommitment', isString)

  validateOptionalField(tx, 'AuditorEncryptedAmount', isString)
}

