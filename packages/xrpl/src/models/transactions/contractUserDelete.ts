import { ValidationError } from '../../errors'

import {
  Account,
  BaseTransaction,
  isAccount,
  validateBaseTransaction,
  validateRequiredField,
} from './common'
import { isUInt32 } from './contractCommon'

/**
 * The ContractUserDelete transaction deletes a user's data held by a smart
 * contract. rippled's preflight refuses every ContractUserDelete with
 * temDISABLED, so {@link validateContractUserDelete} rejects every one.
 *
 * @category Transaction Models
 */
export interface ContractUserDelete extends BaseTransaction {
  TransactionType: 'ContractUserDelete'

  /**
   * The pseudo-account of the contract.
   */
  ContractAccount: Account

  /**
   * The gas the contract may use.
   */
  Gas: number
}

/**
 * Verify the form and type of a {@link ContractUserDelete} at runtime.
 *
 * @param tx - A {@link ContractUserDelete} Transaction.
 * @throws When the {@link ContractUserDelete} is malformed, and otherwise
 * because rippled refuses every ContractUserDelete.
 */
export function validateContractUserDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'ContractAccount', isAccount)
  validateRequiredField(tx, 'Gas', isUInt32)

  throw new ValidationError(
    'ContractUserDelete: disabled on this network (rippled returns temDISABLED for every ContractUserDelete)',
  )
}
