import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isMPTIssuer,
  isString,
  isHexWithByteLength,
  validateBaseTransaction,
  validateRequiredField,
  validateOptionalField,
  validateConfidentialMPTAmount,
  CONFIDENTIAL_EC_POINT_BYTES,
  CONFIDENTIAL_ELGAMAL_CIPHERTEXT_BYTES,
  CONFIDENTIAL_BLINDING_FACTOR_BYTES,
  CONFIDENTIAL_CONVERT_BACK_PROOF_BYTES,
} from './common'

/**
 * The ConfidentialMPTConvertBack transaction moves a holder's confidential
 * (encrypted) balance back into their public MPT balance.
 *
 * @category Transaction Models
 */
export interface ConfidentialMPTConvertBack extends BaseTransaction {
  TransactionType: 'ConfidentialMPTConvertBack'
  /**
   * Identifies the MPTokenIssuance whose balance is being converted back.
   */
  MPTokenIssuanceID: string
  /**
   * The public MPT amount being revealed from the confidential balance.
   */
  MPTAmount: string
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
   * The zero-knowledge proof binding the ciphertexts to the public amount and
   * the resulting balance commitment.
   */
  ZKProof: string
  /**
   * The Pedersen commitment to the holder's current spendable confidential
   * balance — the witness the range proof is built against (33-byte EC point).
   */
  BalanceCommitment: string
}

/**
 * Verify the form and type of a ConfidentialMPTConvertBack at runtime.
 *
 * @param tx - A ConfidentialMPTConvertBack Transaction.
 * @throws When the ConfidentialMPTConvertBack is malformed.
 */
// eslint-disable-next-line max-lines-per-function -- one cohesive field-validation sequence
export function validateConfidentialMPTConvertBack(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  // rippled forbids the issuer from converting back its own issuance (temMALFORMED).
  if (isMPTIssuer(tx.Account, tx.MPTokenIssuanceID)) {
    throw new ValidationError(
      'ConfidentialMPTConvertBack: the issuer cannot convert back its own issuance',
    )
  }
  validateConfidentialMPTAmount(tx, false)
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
  validateRequiredField(
    tx,
    'ZKProof',
    isHexWithByteLength(CONFIDENTIAL_CONVERT_BACK_PROOF_BYTES),
  )
  validateRequiredField(
    tx,
    'BalanceCommitment',
    isHexWithByteLength(CONFIDENTIAL_EC_POINT_BYTES),
  )
}
