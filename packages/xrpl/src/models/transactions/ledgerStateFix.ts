import {
  BaseTransaction,
  isNumber,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * @category Transaction Models
 */
export interface LedgerStateFix extends BaseTransaction {
  TransactionType: 'LedgerStateFix'

  LedgerFixType: number

  Owner?: string
}

/**
 * Verify the form and type of a LedgerStateFix at runtime.
 *
 * @param tx - A LedgerStateFix Transaction.
 * @throws When the LedgerStateFix is malformed.
 */
export function validateLedgerStateFix(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'LedgerFixType', isNumber)

  validateOptionalField(tx, 'Owner', isString)
}
