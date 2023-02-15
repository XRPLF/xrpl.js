import { ValidationError } from '../../errors'
import { Amount, XChainBridge } from '../common'

import {
  BaseTransaction,
  isAmount,
  isXChainBridge,
  validateBaseTransaction,
} from './common'

/**
 *
 * @category Transaction Models
 */
export interface XChainAccountCreateCommit extends BaseTransaction {
  TransactionType: 'XChainAccountCreateCommit'

  XChainBridge: XChainBridge

  SignatureReward: number | string

  Destination: string

  Amount: Amount
}

/**
 * Verify the form and type of a XChainAccountCreateCommit at runtime.
 *
 * @param tx - A XChainAccountCreateCommit Transaction.
 * @throws When the XChainAccountCreateCommit is malformed.
 */
// eslint-disable-next-line max-lines-per-function --  okay for this function, there's a lot of things to check
export function validateXChainAccountCreateCommit(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.XChainBridge == null) {
    throw new ValidationError(
      'XChainAccountCreateCommit: missing field XChainBridge',
    )
  }

  if (!isXChainBridge(tx.XChainBridge)) {
    throw new ValidationError(
      'XChainAccountCreateCommit: invalid field XChainBridge',
    )
  }

  if (tx.SignatureReward == null) {
    throw new ValidationError(
      'XChainAccountCreateCommit: missing field SignatureReward',
    )
  }

  if (
    typeof tx.SignatureReward !== 'number' &&
    typeof tx.SignatureReward !== 'string'
  ) {
    throw new ValidationError(
      'XChainAccountCreateCommit: invalid field SignatureReward',
    )
  }

  if (tx.Destination == null) {
    throw new ValidationError(
      'XChainAccountCreateCommit: missing field Destination',
    )
  }

  if (typeof tx.Destination !== 'string') {
    throw new ValidationError(
      'XChainAccountCreateCommit: invalid field Destination',
    )
  }

  if (tx.Amount == null) {
    throw new ValidationError('XChainAccountCreateCommit: missing field Amount')
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError('XChainAccountCreateCommit: invalid field Amount')
  }
}
