import {
  Account,
  BaseTransaction,
  isAccount,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * The ContractDelete transaction deletes a smart contract and its
 * pseudo-account.
 *
 * @category Transaction Models
 */
export interface ContractDelete extends BaseTransaction {
  TransactionType: 'ContractDelete'

  /**
   * The pseudo-account of the contract to delete.
   */
  ContractAccount: Account
}

/**
 * Verify the form and type of a {@link ContractDelete} at runtime.
 *
 * @param tx - A {@link ContractDelete} Transaction.
 * @throws When the {@link ContractDelete} is malformed.
 */
export function validateContractDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'ContractAccount', isAccount)
}
