import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateRequiredField,
  isAccount,
  Account,
  isArray,
  isRecord,
  isString,
} from './common'

const PERMISSIONS_MAX_LENGTH = 10
const NON_DELEGABLE_TRANSACTIONS = new Set([
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
export function validateDelegateSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Authorize', isAccount)

  if (tx.Authorize === tx.Account) {
    throw new ValidationError(
      'DelegateSet: Authorize and Account must be different.',
    )
  }

  validateRequiredField(tx, 'Permissions', isArray)
  if (tx.Permissions.length > PERMISSIONS_MAX_LENGTH) {
    throw new ValidationError(
      `DelegateSet: Permissions array length cannot be greater than ${PERMISSIONS_MAX_LENGTH}.`,
    )
  }

  const permissionValueSet = new Set()
  tx.Permissions.forEach((permission, index) => {
    if (!isRecord(permission) || !isRecord(permission.Permission)) {
      throw new ValidationError(
        'DelegateSet: Permissions array element is malformed',
      )
    }
    const permissionInner = permission.Permission

    validateRequiredField(permissionInner, 'PermissionValue', isString, {
      paramName: `Permission[${index}].PermissionValue`,
      txType: 'DelegateSet',
    })

    const permissionValue = permissionInner.PermissionValue

    if (NON_DELEGABLE_TRANSACTIONS.has(permissionValue)) {
      throw new ValidationError(
        `DelegateSet: PermissionValue contains non-delegable transaction ${permissionValue}`,
      )
    }
    permissionValueSet.add(permissionValue)
  })
  if (tx.Permissions.length !== permissionValueSet.size) {
    throw new ValidationError(
      'DelegateSet: Permissions array cannot contain duplicate values',
    )
  }
}
