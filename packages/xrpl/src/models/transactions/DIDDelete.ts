import { BaseTransaction, validateBaseTransaction } from './common'

// TODO: add docs

/**
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
