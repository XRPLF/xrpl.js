import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  isString,
  validateRequiredField,
} from './common'

/**
 * The transaction deletes an existing Loan object.
 *
 * @category Transaction Models
 */
export interface LoanDelete extends BaseTransaction {
  TransactionType: 'LoanDelete'

  /**
   * The ID of the Loan object to be deleted.
   */
  LoanID: string
}

/**
 * Verify the form and type of an LoanDelete at runtime.
 *
 * @param tx - LoanDelete Transaction.
 * @throws When LoanDelete is Malformed.
 */
export function validateLoanDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'LoanID', isString)

  if (!isLedgerEntryId(tx.LoanID)) {
    throw new ValidationError(
      `LoanDelete: LoanID must be 64 characters hexadecimal string`,
    )
  }
}
