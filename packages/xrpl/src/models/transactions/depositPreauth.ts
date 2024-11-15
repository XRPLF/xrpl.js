import { ValidationError } from '../../errors'
import { AuthorizeCredential } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

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

  AuthorizeCredentials?: AuthorizeCredential[]

  UnauthorizeCredentials?: AuthorizeCredential[]
}

/**
 * Verify the form and type of a DepositPreauth at runtime.
 *
 * @param tx - A DepositPreauth Transaction.
 * @throws When the DepositPreauth is malformed.
 */
export function validateDepositPreauth(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  // Boolean logic to ensure exactly one of 4 inputs was provided
  const normalAuthorizeXOR = !tx.Authorize !== !tx.Unauthorize
  const authorizeCredentialsXOR =
    !tx.AuthorizeCredentials !== !tx.UnauthorizeCredentials

  if (normalAuthorizeXOR === authorizeCredentialsXOR) {
    throw new ValidationError(
      'DepositPreauth txn requires exactly one input amongst authorize, unauthorize, authorize_credentials and unauthorize_credentials.',
    )
  }

  if (tx.Authorize !== undefined) {
    // is this needed
    if (typeof tx.Authorize !== 'string') {
      throw new ValidationError('DepositPreauth: Authorize must be a string')
    }

    if (tx.Account === tx.Authorize) {
      throw new ValidationError(
        "DepositPreauth: Account can't preauthorize its own address",
      )
    }
  }

  if (tx.AuthorizeCredentials) {
    validateCredentialsList(tx.AuthorizeCredentials)
  } else if (tx.UnauthorizeCredentials) {
    validateCredentialsList(tx.UnauthorizeCredentials)
  }

  if (tx.Unauthorize !== undefined) {
    if (typeof tx.Unauthorize !== 'string') {
      throw new ValidationError('DepositPreauth: Unauthorize must be a string')
    }

    if (tx.Account === tx.Unauthorize) {
      throw new ValidationError(
        "DepositPreauth: Account can't unauthorize its own address",
      )
    }
  }
}

function validateCredentialsList(credentials: AuthorizeCredential[]): void {
  if (credentials.length > 8) {
    throw new ValidationError(
      'DepositPreauth: Credentials list cannot have more than 8 elements',
    )
  } else if (credentials.length === 0) {
    throw new ValidationError(
      'DepositPreauth: Credentials list cannot be empty',
    )
  }

  const credentialsSet = new Set(credentials)
  if (credentialsSet.size !== credentials.length) {
    throw new ValidationError(
      'DepositPreauth: Credentials list cannot contain duplicates',
    )
  }
}
