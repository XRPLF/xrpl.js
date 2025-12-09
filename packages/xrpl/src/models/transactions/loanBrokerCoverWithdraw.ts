import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'

import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  isString,
  validateRequiredField,
  isAmount,
  Account,
  validateOptionalField,
  isAccount,
} from './common'

/**
 * The LoanBrokerCoverWithdraw transaction withdraws the First-Loss Capital from the LoanBroker.
 *
 * @category Transaction Models
 */
export interface LoanBrokerCoverWithdraw extends BaseTransaction {
  TransactionType: 'LoanBrokerCoverWithdraw'

  /**
   * The Loan Broker ID from which to withdraw First-Loss Capital.
   */
  LoanBrokerID: string

  /**
   * The First-Loss Capital amount to withdraw.
   */
  Amount: Amount | MPTAmount

  /**
   * An account to receive the assets. It must be able to receive the asset.
   */
  Destination?: Account
}

/**
 * Verify the form and type of an LoanBrokerCoverWithdraw at runtime.
 *
 * @param tx - LoanBrokerCoverWithdraw Transaction.
 * @throws When LoanBrokerCoverWithdraw is Malformed.
 */
export function validateLoanBrokerCoverWithdraw(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'LoanBrokerID', isString)
  validateRequiredField(tx, 'Amount', isAmount)
  validateOptionalField(tx, 'Destination', isAccount)

  if (!isLedgerEntryId(tx.LoanBrokerID)) {
    throw new ValidationError(
      `LoanBrokerCoverWithdraw: LoanBrokerID must be 64 characters hexadecimal string`,
    )
  }
}
