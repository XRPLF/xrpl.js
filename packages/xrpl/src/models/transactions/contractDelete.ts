import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * @category Transaction Models
 */
export interface ContractDelete extends BaseTransaction {
  TransactionType: 'ContractDelete'

  ContractAccount: string
}

/**
 * Verify the form and type of a ContractDelete at runtime.
 *
 * @param tx - A ContractDelete Transaction.
 * @throws When the ContractDelete is malformed.
 */
export function validateContractDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'ContractAccount', isString)
}
