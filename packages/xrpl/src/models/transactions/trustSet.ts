import { ValidationError } from '../../errors'
import { IssuedCurrencyAmount } from '../common'

import {
  BaseTransaction,
  GlobalFlags,
  isAmount,
  validateBaseTransaction,
} from './common'

/**
 * Enum representing values of {@link TrustSet} transaction flags.
 *
 * @category Transaction Flags
 */
export enum TrustSetFlags {
  /**
   * Authorize the other party to hold currency issued by this account. (No
   * effect unless using the asfRequireAuth AccountSet flag.) Cannot be unset.
   */
  tfSetfAuth = 0x00010000,
  /**
   * Enable the No Ripple flag, which blocks rippling between two trust lines.
   * of the same currency if this flag is enabled on both.
   */
  tfSetNoRipple = 0x00020000,
  /** Disable the No Ripple flag, allowing rippling on this trust line. */
  tfClearNoRipple = 0x00040000,
  /** Freeze the trust line. */
  tfSetFreeze = 0x00100000,
  /** Unfreeze the trust line. */
  tfClearFreeze = 0x00200000,
  /** Deep-Freeze the trustline -- disallow sending and receiving the said IssuedCurrency */
  /** Allowed only if the trustline is already regularly frozen, or if tfSetFreeze is set in the same transaction. */
  tfSetDeepFreeze = 0x00400000,
  /** Clear a Deep-Frozen trustline */
  tfClearDeepFreeze = 0x00800000,
}

/**
 * Map of flags to boolean values representing {@link TrustSet} transaction
 * flags.
 *
 * @category Transaction Flags
 *
 * @example
 * ```typescript
 *
 * const trustSetTx: TrustSet = {
 *  TransactionType: 'TrustSet',
 *  Account: wallet2.getClassicAddress(),
 *  LimitAmount: {
 *    currency: 'FOO',
 *    issuer: wallet1.getClassicAddress(),
 *    value: '10000000000',
 *  },
 *  Flags: {
 *    tfSetNoRipple: true
 *  }
 * }
 *
 * // Autofill the tx to see how flags actually look compared to the interface usage.
 * const autofilledTx = await client.autofill(trustSetTx)
 * console.log(autofilledTx)
 * // {
 * //  TransactionType: 'TrustSet',
 * //  Account: 'r9dAdQQCBcGajVSeC9CqW3LCugjPDnAkEb',
 * //  LimitAmount: {
 * //   currency: 'FOO',
 * //   issuer: 'rWZzUjo5xGiAoRBqzsndyzonXz47UV8u1',
 * //   value: '10000000000'
 * //  },
 * //  Flags: 131072,
 * //  Sequence: 21971483,
 * //  Fee: '12',
 * //  LastLedgerSequence: 21971503
 * // }
 * ```
 */
export interface TrustSetFlagsInterface extends GlobalFlags {
  /**
   * Authorize the other party to hold currency issued by this account. (No
   * effect unless using the asfRequireAuth AccountSet flag.) Cannot be unset.
   */
  tfSetfAuth?: boolean
  /**
   * Enable the No Ripple flag, which blocks rippling between two trust lines
   * of the same currency if this flag is enabled on both.
   */
  tfSetNoRipple?: boolean
  /** Disable the No Ripple flag, allowing rippling on this trust line. */
  tfClearNoRipple?: boolean
  /** Freeze the trust line. */
  tfSetFreeze?: boolean
  /** Unfreeze the trust line. */
  tfClearFreeze?: boolean
  /** Deep-Freeze the trustline -- disallow sending and receiving the said IssuedCurrency */
  /** Allowed only if the trustline is already regularly frozen, or if tfSetFreeze is set in the same transaction. */
  tfSetDeepFreeze?: boolean
  /** Clear a Deep-Frozen trust line */
  tfClearDeepFreeze?: boolean
}

/**
 * Create or modify a trust line linking two accounts.
 *
 * @category Transaction Models
 */
export interface TrustSet extends BaseTransaction {
  TransactionType: 'TrustSet'
  /**
   * Object defining the trust line to create or modify, in the format of a
   * Currency Amount.
   */
  LimitAmount: IssuedCurrencyAmount
  /**
   * Value incoming balances on this trust line at the ratio of this number per
   * 1,000,000,000 units. A value of 0 is shorthand for treating balances at
   * face value.
   */
  QualityIn?: number
  /**
   * Value outgoing balances on this trust line at the ratio of this number per
   * 1,000,000,000 units. A value of 0 is shorthand for treating balances at
   * face value.
   */
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
