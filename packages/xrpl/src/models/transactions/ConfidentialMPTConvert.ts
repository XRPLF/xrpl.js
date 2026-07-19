import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isString,
  isHexWithByteLength,
  validateBaseTransaction,
  validateRequiredField,
  validateOptionalField,
  validateConfidentialMPTAmount,
  CONFIDENTIAL_EC_POINT_BYTES,
  CONFIDENTIAL_ELGAMAL_CIPHERTEXT_BYTES,
  CONFIDENTIAL_BLINDING_FACTOR_BYTES,
  CONFIDENTIAL_CONVERT_PROOF_BYTES,
} from './common'

/**
 * The ConfidentialMPTConvert transaction moves a holder's public MPT balance
 * into their confidential (encrypted) balance. It is also used by a holder to
 * register their ElGamal encryption key for the issuance.
 *
 * @category Transaction Models
 */
export interface ConfidentialMPTConvert extends BaseTransaction {
  TransactionType: 'ConfidentialMPTConvert'
  /**
   * Identifies the MPTokenIssuance whose balance is being converted.
   */
  MPTokenIssuanceID: string
  /**
   * The public MPT amount being converted into the confidential balance.
   */
  MPTAmount: string
  /**
   * The holder's compressed ElGamal encryption key (33-byte EC point). Supplied
   * when the holder registers their encryption key for this issuance.
   */
  HolderEncryptionKey?: string
  /**
   * ElGamal ciphertext of the amount encrypted under the holder's key
   * (66 bytes).
   */
  HolderEncryptedAmount: string
  /**
   * ElGamal ciphertext of the amount encrypted under the issuer's key
   * (66 bytes).
   */
  IssuerEncryptedAmount: string
  /**
   * ElGamal ciphertext of the amount encrypted under the auditor's key
   * (66 bytes). Present only when an auditor key is registered.
   */
  AuditorEncryptedAmount?: string
  /**
   * The scalar blinding factor (32 bytes) shared across the ciphertexts.
   */
  BlindingFactor: string
  /**
   * The zero-knowledge proof binding the ciphertexts to the public amount.
   */
  ZKProof?: string
}

/**
 * HolderEncryptionKey and ZKProof are set together or not at all: rippled rejects
 * a Convert carrying one without the other (temMALFORMED). The ZKProof is a
 * Schnorr proof that registers the holder key.
 *
 * @param tx - The transaction to validate.
 * @throws ValidationError if only one of the pair is present.
 */
function validateHolderKeyProofPairing(tx: Record<string, unknown>): void {
  if ((tx.HolderEncryptionKey == null) !== (tx.ZKProof == null)) {
    throw new ValidationError(
      'ConfidentialMPTConvert: set HolderEncryptionKey and ZKProof together',
    )
  }
}

/**
 * Verify the form and type of a ConfidentialMPTConvert at runtime.
 *
 * @param tx - A ConfidentialMPTConvert Transaction.
 * @throws When the ConfidentialMPTConvert is malformed.
 */
export function validateConfidentialMPTConvert(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  validateConfidentialMPTAmount(tx, true)
  validateOptionalField(
    tx,
    'HolderEncryptionKey',
    isHexWithByteLength(CONFIDENTIAL_EC_POINT_BYTES),
  )
  validateRequiredField(
    tx,
    'HolderEncryptedAmount',
    isHexWithByteLength(CONFIDENTIAL_ELGAMAL_CIPHERTEXT_BYTES),
  )
  validateRequiredField(
    tx,
    'IssuerEncryptedAmount',
    isHexWithByteLength(CONFIDENTIAL_ELGAMAL_CIPHERTEXT_BYTES),
  )
  validateOptionalField(
    tx,
    'AuditorEncryptedAmount',
    isHexWithByteLength(CONFIDENTIAL_ELGAMAL_CIPHERTEXT_BYTES),
  )
  validateRequiredField(
    tx,
    'BlindingFactor',
    isHexWithByteLength(CONFIDENTIAL_BLINDING_FACTOR_BYTES),
  )
  validateOptionalField(
    tx,
    'ZKProof',
    isHexWithByteLength(CONFIDENTIAL_CONVERT_PROOF_BYTES),
  )
  validateHolderKeyProofPairing(tx)
}
