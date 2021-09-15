import { ValidationError } from '../../errors'
import { Amount } from '../common'

import {
  BaseTransaction,
  GlobalFlags,
  isAmount,
  validateBaseTransaction,
} from './common'

export enum TrustSetTransactionFlags {
  tfSetfAuth = 0x00010000,
  tfSetNoRipple = 0x00020000,
  tfClearNoRipple = 0x00040000,
  tfSetFreeze = 0x00100000,
  tfClearFreeze = 0x00200000,
}

export interface TrustSetFlagsInterface extends GlobalFlags {
  /** Authorize the other party to hold currency issued by this account. (No
   * effect unless using the asfRequireAuth AccountSet flag.) Cannot be unset. */
  tfSetfAuth?: boolean
  /** Enable the No Ripple flag, which blocks rippling between two trust lines
   * of the same currency if this flag is enabled on both. */
  tfSetNoRipple?: boolean
  /** Disable the No Ripple flag, allowing rippling on this trust line. */
  tfClearNoRipple?: boolean
  /** Freeze the trust line. */
  tfSetFreeze?: boolean
  /** Unfreeze the trust line. */
  tfClearFreeze?: boolean
}

/** Create or modify a trust line linking two accounts. */
export interface TrustSet extends BaseTransaction {
  TransactionType: 'TrustSet'
  /** Object defining the trust line to create or modify, in the format of a
   * Currency Amount. */
  LimitAmount: Amount
  /** Value incoming balances on this trust line at the ratio of this number per
   * 1,000,000,000 units. A value of 0 is shorthand for treating balances at
   * face value. */
  QualityIn?: number
  /** Value outgoing balances on this trust line at the ratio of this number per
   * 1,000,000,000 units. A value of 0 is shorthand for treating balances at
   * face value. */
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
