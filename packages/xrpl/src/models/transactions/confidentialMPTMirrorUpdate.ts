import { ValidationError } from '../../errors'

import {
  Account,
  BaseTransaction,
  CONFIDENTIAL_ELGAMAL_CIPHERTEXT_BYTES,
  isAccount,
  isHexWithByteLength,
  isMPTIssuer,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

// An equality proof between the old and new ciphertexts
const MIRROR_UPDATE_PROOF_BYTES = 128

/**
 * The ConfidentialMPTMirrorUpdate transaction re-encrypts a holder's
 * confidential balance under the issuer's or the auditor's current key. With
 * Holder set, the issuer updates that holder; without it, a holder updates
 * their own balance.
 *
 * @category Transaction Models
 */
export interface ConfidentialMPTMirrorUpdate extends BaseTransaction {
  TransactionType: 'ConfidentialMPTMirrorUpdate'
  /**
   * Identifies the MPTokenIssuance whose holder balance is updated.
   */
  MPTokenIssuanceID: string
  /**
   * The holder whose balance the issuer updates. Absent when a holder updates
   * their own balance.
   */
  Holder?: Account
  /**
   * The balance as an ElGamal ciphertext under the issuer's key (66 bytes).
   */
  IssuerEncryptedAmount?: string
  /**
   * The balance as an ElGamal ciphertext under the auditor's key (66 bytes).
   */
  AuditorEncryptedAmount?: string
  /**
   * The proof that the new ciphertexts encrypt the same balance (128 bytes).
   */
  ZKProof: string
}

/**
 * Verify the update's mode and content: with Holder, the issuer updates
 * another account; without it, a holder that is not the issuer updates
 * itself; at least one ciphertext is set.
 *
 * @param tx - A ConfidentialMPTMirrorUpdate Transaction.
 * @throws When the mode or content is malformed.
 */
function validateMirrorUpdateMode(tx: Record<string, unknown>): void {
  const isIssuer = isMPTIssuer(tx.Account, tx.MPTokenIssuanceID)
  if (tx.Holder !== undefined && !isIssuer) {
    throw new ValidationError(
      'ConfidentialMPTMirrorUpdate: only the issuer may set Holder',
    )
  }
  if (tx.Holder !== undefined && tx.Holder === tx.Account) {
    throw new ValidationError(
      'ConfidentialMPTMirrorUpdate: Holder must not be the issuer',
    )
  }
  if (tx.Holder === undefined && isIssuer) {
    throw new ValidationError(
      'ConfidentialMPTMirrorUpdate: the issuer must name a Holder',
    )
  }

  if (
    tx.IssuerEncryptedAmount === undefined &&
    tx.AuditorEncryptedAmount === undefined
  ) {
    throw new ValidationError(
      'ConfidentialMPTMirrorUpdate: set IssuerEncryptedAmount or AuditorEncryptedAmount',
    )
  }
}

/**
 * Verify the form and type of a ConfidentialMPTMirrorUpdate at runtime.
 *
 * @param tx - A ConfidentialMPTMirrorUpdate Transaction.
 * @throws When the ConfidentialMPTMirrorUpdate is malformed.
 */
export function validateConfidentialMPTMirrorUpdate(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  validateOptionalField(tx, 'Holder', isAccount)
  validateOptionalField(
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
    'ZKProof',
    isHexWithByteLength(MIRROR_UPDATE_PROOF_BYTES),
  )
  validateMirrorUpdateMode(tx)
}
