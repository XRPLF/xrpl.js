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
 * The Borrower submits a LoanPay transaction to make a Payment on the Loan.
 *
 * @category Transaction Models
 */
export interface LoanPay extends BaseTransaction {
  TransactionType: 'LoanPay'

  /**
   * The ID of the Loan object to be paid to.
   */
  LoanID: string

  /**
   * The amount of funds to pay.
   */
  Amount: Amount | MPTAmount
}

/**
 * Verify the form and type of an LoanPay at runtime.
 *
 * @param tx - LoanPay Transaction.
 * @throws When LoanPay is Malformed.
 */
export function validateLoanPay(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'LoanID', isString)
  validateRequiredField(tx, 'Amount', isAmount)

  if (!isLedgerEntryId(tx.LoanID)) {
    throw new ValidationError(
      `LoanPay: LoanID must be 64 characters hexadecimal string`,
    )
  }
}
