import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateRequiredField,
  isAccount,
  Account,
} from './common'

const PERMISSIONS_MAX_LENGTH = 10

interface Permission {
  Permission: {
    PermissionValue: string
  }
}

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
  Permissions: Permission[]
}

/**
 * Verify the form and type of an DelegateSet at runtime.
 *
 * @param tx - An DelegateSet Transaction.
 * @throws When the DelegateSet is malformed.
 */
// eslint-disable-next-line max-lines-per-function -- necessary for validation
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
  permissions.forEach((permission: Permission) => {
    if (
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- required for validation
      permission == null ||
      Object.keys(permission).length !== 1 ||
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- required for validation
      permission.Permission == null ||
      Object.keys(permission.Permission).length !== 1
    ) {
      throw new ValidationError(
        'DelegateSet: Permissions array element is malformed',
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- required for validation
    if (permission.Permission.PermissionValue == null) {
      throw new ValidationError('DelegateSet: PermissionValue must be defined')
    }
    if (typeof permission.Permission.PermissionValue !== 'string') {
      throw new ValidationError(`DelegateSet: PermissionValue must be a string`)
    }
  })
  const permissionsSet = new Set(
    permissions.map(
      (permission: Permission) => permission.Permission.PermissionValue,
    ),
  )
  if (permissions.length !== permissionsSet.size) {
    throw new ValidationError(
      `DelegateSet: Permissions array cannot contain duplicate values`,
    )
  }
}
