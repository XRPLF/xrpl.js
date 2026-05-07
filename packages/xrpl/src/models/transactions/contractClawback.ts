import { Amount } from '../common'

import {
  BaseTransaction,
  isAmount,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * @category Transaction Models
 */
export interface ContractClawback extends BaseTransaction {
  TransactionType: 'ContractClawback'

  Amount: Amount

  ContractAccount?: string
}

/**
 * Verify the form and type of a ContractClawback at runtime.
 *
 * @param tx - A ContractClawback Transaction.
 * @throws When the ContractClawback is malformed.
 */
export function validateContractClawback(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Amount', isAmount)

  validateOptionalField(tx, 'ContractAccount', isString)
}
