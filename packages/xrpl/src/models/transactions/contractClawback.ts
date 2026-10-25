import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'

import {
  Account,
  BaseTransaction,
  isAccount,
  isAmount,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * The ContractClawback transaction claws back funds from a smart contract.
 * rippled's preflight refuses every ContractClawback with temDISABLED, so
 * {@link validateContractClawback} rejects every one.
 *
 * @category Transaction Models
 */
export interface ContractClawback extends BaseTransaction {
  TransactionType: 'ContractClawback'

  /**
   * The pseudo-account of the contract.
   */
  ContractAccount?: Account

  /**
   * The amount to claw back: XRP, an issued currency or an MPT.
   */
  Amount: Amount | MPTAmount
}

/**
 * Verify the form and type of a {@link ContractClawback} at runtime.
 *
 * @param tx - A {@link ContractClawback} Transaction.
 * @throws When the {@link ContractClawback} is malformed, and otherwise
 * because rippled refuses every ContractClawback.
 */
export function validateContractClawback(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateOptionalField(tx, 'ContractAccount', isAccount)
  validateRequiredField(tx, 'Amount', isAmount)

  throw new ValidationError(
    'ContractClawback: the node refuses every ContractClawback (temDISABLED)',
  )
}
