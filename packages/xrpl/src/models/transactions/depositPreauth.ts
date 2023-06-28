/* eslint-disable complexity -- Necessary for validateDepositPreauth */
import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

export interface DepositPreauthBase extends BaseTransaction {
  TransactionType: 'DepositPreauth'
}

export interface DepositPreauthWithAuthorize extends DepositPreauthBase {
  /** The XRP Ledger address of the sender to preauthorize. */
  Authorize: string
  Unauthorize: never
}

export interface DepositPreauthWithUnauthorize extends DepositPreauthBase {
  Authorize: never
  /** The XRP Ledger address of a sender whose preauthorization should be revoked. */
  Unauthorize: string
}

/**
 * A DepositPreauth transaction gives another account pre-approval to deliver
 * payments to the sender of this transaction. This is only useful if the sender
 * of this transaction is using (or plans to use) Deposit Authorization.
 *
 * @category Transaction Models
 *
 * @interface
 */
export type DepositPreauth =
  | DepositPreauthWithAuthorize
  | DepositPreauthWithUnauthorize

/**
 * Verify the form and type of a DepositPreauth at runtime.
 *
 * @param tx - A DepositPreauth Transaction.
 * @throws When the DepositPreauth is malformed.
 */
export function validateDepositPreauth(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Authorize !== undefined && tx.Unauthorize !== undefined) {
    throw new ValidationError(
      "DepositPreauth: can't provide both Authorize and Unauthorize fields",
    )
  }

  if (tx.Authorize === undefined && tx.Unauthorize === undefined) {
    throw new ValidationError(
      'DepositPreauth: must provide either Authorize or Unauthorize field',
    )
  }

  if (tx.Authorize !== undefined) {
    if (typeof tx.Authorize !== 'string') {
      throw new ValidationError('DepositPreauth: Authorize must be a string')
    }

    if (tx.Account === tx.Authorize) {
      throw new ValidationError(
        "DepositPreauth: Account can't preauthorize its own address",
      )
    }
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
