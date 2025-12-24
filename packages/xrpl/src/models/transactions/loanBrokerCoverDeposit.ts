import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'

import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  isString,
  validateRequiredField,
  isAmount,
} from './common'

/**
 * The transaction deposits First Loss Capital into the LoanBroker object.
 *
 * @category Transaction Models
 */
export interface LoanBrokerCoverDeposit extends BaseTransaction {
  TransactionType: 'LoanBrokerCoverDeposit'

  /**
   * The Loan Broker ID to deposit First-Loss Capital.
   */
  LoanBrokerID: string

  /**
   * The First-Loss Capital amount to deposit.
   */
  Amount: Amount | MPTAmount
}

/**
 * Verify the form and type of an LoanBrokerCoverDeposit at runtime.
 *
 * @param tx - LoanBrokerCoverDeposit Transaction.
 * @throws When LoanBrokerCoverDeposit is Malformed.
 */
export function validateLoanBrokerCoverDeposit(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'LoanBrokerID', isString)
  validateRequiredField(tx, 'Amount', isAmount)

  if (!isLedgerEntryId(tx.LoanBrokerID)) {
    throw new ValidationError(
      `LoanBrokerCoverDeposit: LoanBrokerID must be 64 characters hexadecimal string`,
    )
  }
}
