import { ValidationError } from '../../errors'
import { AuthorizeCredential } from '../common'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateCredentialsList,
  MAX_AUTHORIZED_CREDENTIALS,
  areAddressesEqual,
  isString,
} from './common'

/**
 * A DepositPreauth transaction gives another account pre-approval to deliver
 * payments to the sender of this transaction. This is only useful if the sender
 * of this transaction is using (or plans to use) Deposit Authorization.
 *
 * @category Transaction Models
 */
export interface DepositPreauth extends BaseTransaction {
  TransactionType: 'DepositPreauth'
  /** The XRP Ledger address of the sender to preauthorize. */
  Authorize?: string
  /**
   * The XRP Ledger address of a sender whose preauthorization should be.
   * revoked.
   */
  Unauthorize?: string

  /**
   * The credential(s) to preauthorize.
   */
  AuthorizeCredentials?: AuthorizeCredential[]

  /**
   * The credential(s) whose preauthorization should be revoked.
   */
  UnauthorizeCredentials?: AuthorizeCredential[]
}

function validateAuthorizationField(
  tx: Record<string, unknown>,
  field: 'Authorize' | 'Unauthorize',
): void {
  const value = tx[field]
  if (!isString(value)) {
    throw new ValidationError(`DepositPreauth: ${field} must be a string`)
  }
  if (isString(tx.Account) && areAddressesEqual(tx.Account, value)) {
    const action = field === 'Authorize' ? 'preauthorize' : 'unauthorize'
    throw new ValidationError(
      `DepositPreauth: Account can't ${action} its own address`,
    )
  }
}

/**
 * Verify the form and type of a DepositPreauth at runtime.
 *
 * @param tx - A DepositPreauth Transaction.
 * @throws When the DepositPreauth is malformed.
 */
export function validateDepositPreauth(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateSingleAuthorizationFieldProvided(tx)

  if (tx.Authorize !== undefined) {
    validateAuthorizationField(tx, 'Authorize')
  } else if (tx.Unauthorize !== undefined) {
    validateAuthorizationField(tx, 'Unauthorize')
  } else if (tx.AuthorizeCredentials !== undefined) {
    validateCredentialsList(
      tx.AuthorizeCredentials,
      tx.TransactionType,
      false,
      MAX_AUTHORIZED_CREDENTIALS,
    )
  } else if (tx.UnauthorizeCredentials !== undefined) {
    validateCredentialsList(
      tx.UnauthorizeCredentials,
      tx.TransactionType,
      false,
      MAX_AUTHORIZED_CREDENTIALS,
    )
  }
}

// Boolean logic to ensure exactly one of 4 inputs was provided
function validateSingleAuthorizationFieldProvided(
  tx: Record<string, unknown>,
): void {
  const fields = [
    'Authorize',
    'Unauthorize',
    'AuthorizeCredentials',
    'UnauthorizeCredentials',
  ]
  const countProvided = fields.filter((key) => tx[key] !== undefined).length

  if (countProvided !== 1) {
    throw new ValidationError(
      'DepositPreauth: Requires exactly one field of the following: Authorize, Unauthorize, AuthorizeCredentials, UnauthorizeCredentials.',
    )
  }
}
