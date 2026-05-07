import { Parameter } from '../common'

import {
  BaseTransaction,
  isArray,
  isNumber,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * @category Transaction Models
 */
export interface ContractCall extends BaseTransaction {
  TransactionType: 'ContractCall'

  // Optional because autofill will add it if missing
  ComputationAllowance?: number

  ContractAccount: string

  FunctionName: string

  Parameters?: Parameter[]
}

/**
 * Verify the form and type of a ContractCall at runtime.
 *
 * @param tx - A ContractCall Transaction.
 * @throws When the ContractCall is malformed.
 */
export function validateContractCall(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'ComputationAllowance', isNumber)

  validateRequiredField(tx, 'ContractAccount', isString)

  validateRequiredField(tx, 'FunctionName', isString)

  validateOptionalField(tx, 'Parameters', isArray)
}
