import {
  BaseTransaction,
  isNumber,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

/**
 * Delete an Oracle ledger entry.
 *
 * @category Transaction Models
 */
export interface OracleDelete extends BaseTransaction {
  TransactionType: 'OracleDelete'

  /**
   * A unique identifier of the price oracle for the Account.
   */
  OracleDocumentID: number
}

/**
 * Verify the form and type of a OracleDelete at runtime.
 *
 * @param tx - A OracleDelete Transaction.
 * @throws When the OracleDelete is malformed.
 */
export function validateOracleDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'OracleDocumentID', isNumber)
}
