import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

export interface PermissionedDomainDelete extends BaseTransaction {
  TransactionType: 'PermissionedDomainDelete'

  DomainID: string
}

/**
 * Verify the form and type of a PermissionedDomainDelete transaction.
 *
 * @param tx - The transaction to verify.
 * @throws When the transaction is malformed.
 */
export function validatePermissionedDomainDelete(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'DomainID', isString)
}
