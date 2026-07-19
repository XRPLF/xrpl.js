import {
  Account,
  BaseTransaction,
  isAccount,
  isHexWithByteLength,
  isString,
  validateBaseTransaction,
  validateRequiredField,
  validateConfidentialMPTAmount,
  CONFIDENTIAL_CLAWBACK_PROOF_BYTES,
} from './common'

/**
 * The ConfidentialMPTClawback transaction lets an issuer claw back a confidential
 * MPT amount from a holder's confidential balance.
 *
 * @category Transaction Models
 */
export interface ConfidentialMPTClawback extends BaseTransaction {
  TransactionType: 'ConfidentialMPTClawback'
  /**
   * Identifies the MPTokenIssuance being clawed back.
   */
  MPTokenIssuanceID: string
  /** The XRPL Address of the holder whose confidential balance is clawed back. */
  Holder: Account
  /**
   * The MPT amount being clawed back from the holder.
   */
  MPTAmount: string
  /**
   * The zero-knowledge proof authorizing the clawback against the holder's
   * confidential balance.
   */
  ZKProof: string
}

/**
 * Verify the form and type of a ConfidentialMPTClawback at runtime.
 *
 * @param tx - A ConfidentialMPTClawback Transaction.
 * @throws When the ConfidentialMPTClawback is malformed.
 */
export function validateConfidentialMPTClawback(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
  validateRequiredField(tx, 'Holder', isAccount)
  validateConfidentialMPTAmount(tx, false)
  validateRequiredField(
    tx,
    'ZKProof',
    isHexWithByteLength(CONFIDENTIAL_CLAWBACK_PROOF_BYTES),
  )
}
