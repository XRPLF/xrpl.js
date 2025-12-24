import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  isString,
  validateRequiredField,
} from './common'

/**
 * The transaction deletes LoanBroker ledger object.
 *
 * @category Transaction Models
 */
export interface LoanBrokerDelete extends BaseTransaction {
  TransactionType: 'LoanBrokerDelete'

  /**
   * The Loan Broker ID that the transaction is deleting.
   */
  LoanBrokerID: string
}

/**
 * Verify the form and type of an LoanBrokerDelete at runtime.
 *
 * @param tx - LoanBrokerDelete Transaction.
 * @throws When LoanBrokerDelete is Malformed.
 */
export function validateLoanBrokerDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'LoanBrokerID', isString)

  if (!isLedgerEntryId(tx.LoanBrokerID)) {
    throw new ValidationError(
      `LoanBrokerDelete: LoanBrokerID must be 64 characters hexadecimal string`,
    )
  }
}
