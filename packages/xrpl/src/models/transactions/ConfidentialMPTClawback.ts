import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
  isAccount,
  Account,
} from './common'

/**
 * The ConfidentialMPTClawback transaction allows an issuer to clawback
 * confidential MPT balance from a holder.
 *
 * Unlike regular clawback, this requires a zero-knowledge proof to verify
 * that the holder actually has the amount being clawed back, since the
 * issuer cannot see the holder's actual balance.
 *
 * This transaction can only be submitted by the issuer of the MPT, and
 * only if the MPT was created with the tfMPTCanClawback flag enabled.
 */
export interface ConfidentialMPTClawback extends BaseTransaction {
  TransactionType: 'ConfidentialMPTClawback'

  /**
   * Identifies the MPTokenIssuance from which to clawback.
   */
  MPTokenIssuanceID: string

  /**
   * The holder account from which to clawback confidential balance.
   */
  Holder: Account

  /**
   * The amount of MPT to clawback from the holder's confidential balance.
   * This is a cleartext amount as a string.
   */
  MPTAmount: string

  /**
   * Zero-knowledge proof proving the holder has sufficient confidential
   * balance for the clawback and that the operation is valid.
   */
  ZKProof: string
}

/**
 * Verify the form and type of a ConfidentialMPTClawback at runtime.
 *
 * @param tx - A ConfidentialMPTClawback Transaction.
 * @throws When the ConfidentialMPTClawback is Malformed.
 */
export function validateConfidentialMPTClawback(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  validateRequiredField(tx, 'Holder', isAccount)
  validateRequiredField(tx, 'MPTAmount', isString)
  validateRequiredField(tx, 'ZKProof', isString)
}

