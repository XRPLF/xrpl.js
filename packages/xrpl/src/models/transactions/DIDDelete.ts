import { BaseTransaction, validateBaseTransaction } from './common'

/**
 * Delete the DID ledger entry associated with the specified Account field.
 *
 * @category Transaction Models
 */
export interface DIDDelete extends BaseTransaction {
  TransactionType: 'DIDDelete'
}

/**
 * Verify the form and type of a DIDDelete at runtime.
 *
 * @param tx - A DIDDelete Transaction.
 * @throws When the DIDDelete is malformed.
 */
export function validateDIDDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
}
