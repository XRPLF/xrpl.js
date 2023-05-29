import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 *
 * @category Transaction Models
 */
export interface Import extends BaseTransaction {
  TransactionType: 'Import'
  /**
   * Hex value representing a VL Blob.
   */
  Blob?: string
}

/**
 * Verify the form and type of an Import at runtime.
 *
 * @param tx - An Import Transaction.
 * @throws When the Import is Malformed.
 */
export function validateImport(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
}
