import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
  validateOptionalField,
} from './common'

/**
 * The ConfidentialMPTConvert transaction converts public MPT balance
 * into confidential (encrypted) balance. The amount being converted
 * is specified in cleartext, but the resulting balance is encrypted
 * using EC-ElGamal encryption.
 *
 * This transaction requires a zero-knowledge proof (ZKProof) when
 * the holder has existing confidential balance to prove the validity
 * of the conversion.
 */
export interface ConfidentialMPTConvert extends BaseTransaction {
  TransactionType: 'ConfidentialMPTConvert'

  /**
   * Identifies the MPTokenIssuance for which to convert balance.
   */
  MPTokenIssuanceID: string

  /**
   * The amount of MPT to convert from public to confidential balance.
   * This is a cleartext amount as a string.
   */
  MPTAmount: string

  /**
   * Optional. The holder's EC-ElGamal public key for encryption.
   * Required if the holder doesn't already have a key registered.
   * 33 bytes compressed EC point, hex-encoded.
   */
  HolderElGamalPublicKey?: string

  /**
   * The encrypted amount for the holder's confidential balance.
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
   * Optional. Zero-knowledge proof required when holder has existing
   * confidential balance. Proves the validity of the conversion.
   */
  ZKProof?: string
}

/**
 * Verify the form and type of a ConfidentialMPTConvert at runtime.
 *
 * @param tx - A ConfidentialMPTConvert Transaction.
 * @throws When the ConfidentialMPTConvert is Malformed.
 */
export function validateConfidentialMPTConvert(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  validateRequiredField(tx, 'MPTAmount', isString)
  validateRequiredField(tx, 'HolderEncryptedAmount', isString)
  validateRequiredField(tx, 'IssuerEncryptedAmount', isString)
  validateRequiredField(tx, 'BlindingFactor', isString)

  validateOptionalField(tx, 'HolderElGamalPublicKey', isString)
  validateOptionalField(tx, 'AuditorEncryptedAmount', isString)
  validateOptionalField(tx, 'ZKProof', isString)
}

