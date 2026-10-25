import {
  BaseTransaction,
  isCounterpartySignature,
  isLedgerEntryId,
  validateBaseTransaction,
  validateCounterpartySigningKey,
  validateFlagsMask,
  validateRequiredField,
} from './common'
import type { CounterpartySignature } from './loanSet'

/**
 * The FirewallDelete transaction deletes an account's Firewall and every
 * WithdrawPreauth of the account, with the Counterparty's signature.
 *
 * @category Transaction Models
 */
export interface FirewallDelete extends BaseTransaction {
  TransactionType: 'FirewallDelete'

  /**
   * The signature of the Firewall's recorded Counterparty.
   */
  CounterpartySignature: CounterpartySignature

  /**
   * The ID of the Firewall to delete.
   */
  FirewallID: string
}

/**
 * Verify the form and type of a {@link FirewallDelete} at runtime.
 *
 * @param tx - A {@link FirewallDelete} Transaction.
 * @throws When the {@link FirewallDelete} is malformed.
 */
export function validateFirewallDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx)

  validateRequiredField(tx, 'CounterpartySignature', isCounterpartySignature)
  validateRequiredField(tx, 'FirewallID', isLedgerEntryId)

  validateCounterpartySigningKey(tx)
}
