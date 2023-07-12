import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

/**
 *
 *
 * @category Transaction Models
 */
export interface Import extends BaseTransaction {
  TransactionType: 'Import'
  /**
   *
   */
  Issuer?: string
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

  if (tx.Issuer !== undefined && typeof tx.Issuer !== 'string') {
    throw new ValidationError('Import: Issuer must be a string')
  }

  if (tx.Account === tx.Issuer) {
    throw new ValidationError('Import: Issuer and Account must not be equal')
  }
}
