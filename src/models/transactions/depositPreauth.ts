/* eslint-disable complexity -- Necessary for validateDepositPreauth */
import { ValidationError } from '../../common/errors'

import { BaseTransaction, validateBaseTransaction } from './common'

export interface DepositPreauth extends BaseTransaction {
  TransactionType: 'DepositPreauth'
  Authorize?: string
  Unauthorize?: string
}

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
