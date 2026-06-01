import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * The ConfidentialMPTMergeInbox transaction folds a holder's pending
 * confidential inbox balance into their spendable confidential balance.
 *
 * @category Transaction Models
 */
export interface ConfidentialMPTMergeInbox extends BaseTransaction {
  TransactionType: 'ConfidentialMPTMergeInbox'
  /**
   * Identifies the MPTokenIssuance whose confidential inbox is being merged.
   */
  MPTokenIssuanceID: string
}

/**
 * Verify the form and type of a ConfidentialMPTMergeInbox at runtime.
 *
 * @param tx - A ConfidentialMPTMergeInbox Transaction.
 * @throws When the ConfidentialMPTMergeInbox is malformed.
 */
export function validateConfidentialMPTMergeInbox(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
}
