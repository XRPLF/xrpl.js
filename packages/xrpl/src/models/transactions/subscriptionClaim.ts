import { Amount, MPTAmount } from '../common'

import {
  BaseTransaction,
  isAmount,
  isLedgerEntryId,
  validateBaseTransaction,
  validateFlagsMask,
  validateRequiredField,
} from './common'

/**
 * The SubscriptionClaim transaction pays the Subscription's Destination, the
 * sender, an Amount out of the current claim period's balance.
 *
 * @category Transaction Models
 */
export interface SubscriptionClaim extends BaseTransaction {
  TransactionType: 'SubscriptionClaim'

  /**
   * The amount to claim, in the Subscription's asset (XRP, IOU or MPT).
   */
  Amount: Amount | MPTAmount

  /**
   * The ID of the Subscription to claim from.
   */
  SubscriptionID: string
}

/**
 * Verify the form and type of a {@link SubscriptionClaim} at runtime.
 *
 * @param tx - A {@link SubscriptionClaim} Transaction.
 * @throws When the {@link SubscriptionClaim} is malformed.
 */
export function validateSubscriptionClaim(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)

  validateRequiredField(tx, 'Amount', isAmount)
  validateRequiredField(tx, 'SubscriptionID', isLedgerEntryId)
}
