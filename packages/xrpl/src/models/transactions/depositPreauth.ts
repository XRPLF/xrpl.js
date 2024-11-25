import { ValidationError } from '../../errors'
import { AuthorizeCredential } from '../common'

import { BaseTransaction, validateBaseTransaction } from './common'

const MAX_CREDENTIALS_LIST_LENGTH = 8

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

  validateSingleAuthorizationFieldProvided(tx)

  if (tx.Authorize !== undefined) {
    if (typeof tx.Authorize !== 'string') {
      throw new ValidationError('DepositPreauth: Authorize must be a string')
    }

    if (tx.Account === tx.Authorize) {
      throw new ValidationError(
        "DepositPreauth: Account can't preauthorize its own address",
      )
    }
  } else if (tx.Unauthorize !== undefined) {
    if (typeof tx.Unauthorize !== 'string') {
      throw new ValidationError('DepositPreauth: Unauthorize must be a string')
    }

    if (tx.Account === tx.Unauthorize) {
      throw new ValidationError(
        "DepositPreauth: Account can't unauthorize its own address",
      )
    }
  } else if (tx.AuthorizeCredentials !== undefined) {
    validateCredentialsList(tx.AuthorizeCredentials)
  } else if (tx.UnauthorizeCredentials !== undefined) {
    validateCredentialsList(tx.UnauthorizeCredentials)
  }
}

function validateCredentialsList(credentials: unknown): void {
  if (!Array.isArray(credentials)) {
    throw new ValidationError(
      'DepositPreauth: Credentials list must be an array',
    )
  }

  if (credentials.length > MAX_CREDENTIALS_LIST_LENGTH) {
    throw new ValidationError(
      'DepositPreauth: Credentials list cannot have more than 8 elements',
    )
  } else if (credentials.length === 0) {
    throw new ValidationError(
      'DepositPreauth: Credentials list cannot be empty',
    )
  }

  function isAuthorizeCredential(
    value: AuthorizeCredential,
  ): value is AuthorizeCredential {
    if (value.Credential.CredentialType && value.Credential.issuer) {
      return true
    }
    return false
  }

  credentials.forEach((credential) => {
    if (!isAuthorizeCredential(credential)) {
      throw new ValidationError(
        'DepositPreauth: Invalid Credentials list format',
      )
    }
  })

  const credentialsSet = new Set(credentials)
  if (credentialsSet.size !== credentials.length) {
    throw new ValidationError(
      'DepositPreauth: Credentials list cannot contain duplicates',
    )
  }
}

// Boolean logic to ensure exactly one of 4 inputs was provided
function validateSingleAuthorizationFieldProvided(
  tx: Record<string, unknown>,
): void {
  const normalAuthorizeXOR = !tx.Authorize !== !tx.Unauthorize
  const authorizeCredentialsXOR =
    !tx.AuthorizeCredentials !== !tx.UnauthorizeCredentials

  if (normalAuthorizeXOR === authorizeCredentialsXOR) {
    throw new ValidationError(
      'DepositPreauth txn requires exactly one input amongst authorize, unauthorize, authorize_credentials and unauthorize_credentials.',
    )
  }
}
