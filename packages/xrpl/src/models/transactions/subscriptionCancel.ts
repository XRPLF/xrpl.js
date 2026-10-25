import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  validateFlagsMask,
  validateRequiredField,
} from './common'

/**
 * The SubscriptionCancel transaction deletes a Subscription. Its owner or
 * Destination may cancel it at any time, and any account once it has expired.
 *
 * @category Transaction Models
 */
export interface SubscriptionCancel extends BaseTransaction {
  TransactionType: 'SubscriptionCancel'

  /**
   * The ID of the Subscription to cancel.
   */
  SubscriptionID: string
}

/**
 * Verify the form and type of a {@link SubscriptionCancel} at runtime.
 *
 * @param tx - A {@link SubscriptionCancel} Transaction.
 * @throws When the {@link SubscriptionCancel} is malformed.
 */
export function validateSubscriptionCancel(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)

  validateRequiredField(tx, 'SubscriptionID', isLedgerEntryId)
}
