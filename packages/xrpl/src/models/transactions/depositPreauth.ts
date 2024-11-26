import { ValidationError } from '../../errors'
import { AuthorizeCredential } from '../common'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateCredentialsList,
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
    validateCredentialsList(
      tx.AuthorizeCredentials,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- confirmed in base transaction check
      tx.TransactionType as string,
    )
  } else if (tx.UnauthorizeCredentials !== undefined) {
    validateCredentialsList(
      tx.UnauthorizeCredentials,
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- confirmed in base transaction check
      tx.TransactionType as string,
    )
  }
}

// Boolean logic to ensure exactly one of 4 inputs was provided
function validateSingleAuthorizationFieldProvided(
  tx: Record<string, unknown>,
): void {
  const countProvided =
    Number(tx.Authorize !== undefined) +
    Number(tx.Unauthorize !== undefined) +
    Number(tx.AuthorizeCredentials !== undefined) +
    Number(tx.UnauthorizeCredentials !== undefined)

  if (countProvided !== 1) {
    throw new ValidationError(
      'DepositPreauth: Requires exactly one input amongst Authorize, Unauthorize, AuthorizeCredentials and UnauthorizeCredentials.',
    )
  }
}
