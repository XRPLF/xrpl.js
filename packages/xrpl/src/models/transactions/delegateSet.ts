import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateRequiredField,
  isAccount,
  Account,
} from './common'

const PERMISSIONS_MAX_LENGTH = 10

/**
 * DelegateSet allows an account to delegate a set of permissions to another account.
 *
 * @category Transaction Models
 */
export interface DelegateSet extends BaseTransaction {
  TransactionType: 'DelegateSet'

  /**
   * The authorized account.
   */
  Authorize: Account

  /**
   * The transaction permissions (represented by integers) that the account has been granted.
   */
  Permissions: number[]
}

/**
 * Verify the form and type of an DelegateSet at runtime.
 *
 * @param tx - An DelegateSet Transaction.
 * @throws When the DelegateSet is malformed.
 */
export function validateDelegateSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Authorize', isAccount)

  if (tx.Authorize === tx.Account) {
    throw new ValidationError(
      'DelegateSet: Authorize and Account must be different.',
    )
  }

  const permissions = tx.Permissions
  if (permissions == null) {
    throw new ValidationError('DelegateSet: missing field Permissions')
  }
  if (!Array.isArray(permissions)) {
    throw new ValidationError('DelegateSet: Permissions must be an array')
  }
  if (permissions.length === 0) {
    throw new ValidationError(`DelegateSet: Permissions array cannot be empty`)
  }
  if (permissions.length > PERMISSIONS_MAX_LENGTH) {
    throw new ValidationError(
      `DelegateSet: Permissions array length cannot be greater than ${PERMISSIONS_MAX_LENGTH}.`,
    )
  }
  permissions.forEach((permission) => {
    if (typeof permission !== 'number') {
      throw new ValidationError(
        `DelegateSet: Permissions array must only contain integer values`,
      )
    }
  })
  const permissionsSet = new Set(permissions)
  if (permissions.length !== permissionsSet.size) {
    throw new ValidationError(
      `DelegateSet: Permissions array cannot contain duplicate values`,
    )
  }
}
