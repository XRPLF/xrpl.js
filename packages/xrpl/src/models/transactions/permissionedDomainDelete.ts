import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateRequiredField
} from './common'

export interface PermissionedDomainDelete extends BaseTransaction {
  TransactionType: 'PermissionedDomainDelete'

  DomainID: string
}

export function validatePermissionedDomainDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'DomainID', isString)
}
