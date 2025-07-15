import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateRequiredField,
  isAccount,
  Account,
} from './common'

const PERMISSIONS_MAX_LENGTH = 10
const NON_DELEGATABLE_TRANSACTIONS = new Set([
  'AccountSet',
  'SetRegularKey',
  'SignerListSet',
  'DelegateSet',
  'AccountDelete',
  'Batch',
  // Pseudo transactions below:
  'EnableAmendment',
  'SetFee',
  'UNLModify',
])

export interface Permission {
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

  validateRequiredField(tx, 'Permissions', Array.isArray)

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- required for validation
  const permissions = tx.Permissions as DelegateSet['Permissions']
  if (permissions.length > PERMISSIONS_MAX_LENGTH) {
    throw new ValidationError(
      `DelegateSet: Permissions array length cannot be greater than ${PERMISSIONS_MAX_LENGTH}.`,
    )
  }

  const permissionValueSet = new Set()
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
    const permissionValue = permission.Permission.PermissionValue
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- required for validation
    if (permissionValue == null) {
      throw new ValidationError('DelegateSet: PermissionValue must be defined')
    }
    if (typeof permissionValue !== 'string') {
      throw new ValidationError('DelegateSet: PermissionValue must be a string')
    }
    if (NON_DELEGATABLE_TRANSACTIONS.has(permissionValue)) {
      throw new ValidationError(
        `DelegateSet: PermissionValue contains a non-delegatable transaction ${permissionValue}`,
      )
    }
    permissionValueSet.add(permissionValue)
  })
  if (permissions.length !== permissionValueSet.size) {
    throw new ValidationError(
      'DelegateSet: Permissions array cannot contain duplicate values',
    )
  }
}
