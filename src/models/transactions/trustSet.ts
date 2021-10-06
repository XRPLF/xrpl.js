import { ValidationError } from '../../errors'
import { Amount } from '../common'

import {
  BaseTransaction,
  GlobalFlags,
  isAmount,
  validateBaseTransaction,
} from './common'

export enum TrustSetFlags {
  tfSetfAuth = 0x00010000,
  tfSetNoRipple = 0x00020000,
  tfClearNoRipple = 0x00040000,
  tfSetFreeze = 0x00100000,
  tfClearFreeze = 0x00200000,
}

export interface TrustSetFlagsInterface extends GlobalFlags {
  tfSetfAuth?: boolean
  tfSetNoRipple?: boolean
  tfClearNoRipple?: boolean
  tfSetFreeze?: boolean
  tfClearFreeze?: boolean
}

export interface TrustSet extends BaseTransaction {
  TransactionType: 'TrustSet'
  LimitAmount: Amount
  QualityIn?: number
  QualityOut?: number
  Flags?: number | TrustSetFlagsInterface
}

/**
 * Verify the form and type of a TrustSet at runtime.
 *
 * @param tx - A TrustSet Transaction.
 * @throws When the TrustSet is malformed.
 */
export function validateTrustSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  const { LimitAmount, QualityIn, QualityOut } = tx

  if (LimitAmount === undefined) {
    throw new ValidationError('TrustSet: missing field LimitAmount')
  }

  if (!isAmount(LimitAmount)) {
    throw new ValidationError('TrustSet: invalid LimitAmount')
  }

  if (QualityIn !== undefined && typeof QualityIn !== 'number') {
    throw new ValidationError('TrustSet: QualityIn must be a number')
  }

  if (QualityOut !== undefined && typeof QualityOut !== 'number') {
    throw new ValidationError('TrustSet: QualityOut must be a number')
  }
}
