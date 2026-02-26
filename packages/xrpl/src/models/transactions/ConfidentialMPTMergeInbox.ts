import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * The ConfidentialMPTMergeInbox transaction merges the holder's
 * confidential inbox balance into their main confidential spending balance.
 *
 * When confidential MPT is sent to a holder, it accumulates in their
 * "inbox" balance. This transaction allows the holder to merge those
 * incoming funds into their main "spending" balance so they can use them.
 *
 * This transaction is permissionless and requires no proof because
 * the holder is simply consolidating their own balances.
 */
export interface ConfidentialMPTMergeInbox extends BaseTransaction {
  TransactionType: 'ConfidentialMPTMergeInbox'

  /**
   * Identifies the MPTokenIssuance for which to merge inbox balance.
   */
  MPTokenIssuanceID: string
}

/**
 * Verify the form and type of a ConfidentialMPTMergeInbox at runtime.
 *
 * @param tx - A ConfidentialMPTMergeInbox Transaction.
 * @throws When the ConfidentialMPTMergeInbox is Malformed.
 */
export function validateConfidentialMPTMergeInbox(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'MPTokenIssuanceID', isString)
}

