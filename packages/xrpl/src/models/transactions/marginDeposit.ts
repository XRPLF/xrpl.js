import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'
import { hasFlag } from '../utils'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAmount,
  isLedgerEntryId,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Enum representing values of {@link MarginDeposit} transaction flags.
 *
 * @category Transaction Flags
 */
export enum MarginDepositFlags {
  /**
   * The exchange owner deposits first-loss cover; no margin account is
   * touched.
   */
  tfPerpCover = 0x00010000,
}

/**
 * Map of flags to boolean values representing {@link MarginDeposit}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export interface MarginDepositFlagsInterface extends GlobalFlagsInterface {
  tfPerpCover?: boolean
}

/**
 * The MarginDeposit transaction deposits collateral into a margin account on
 * a perpetual futures exchange, creating the account if it does not exist, or
 * deposits the exchange owner's cover.
 *
 * @category Transaction Models
 */
export interface MarginDeposit extends BaseTransaction {
  TransactionType: 'MarginDeposit'

  /** The ID of the PerpExchange ledger entry to deposit on. */
  ExchangeID: string

  /**
   * The subaccount number of the margin account. Defaults to 0; absent with
   * tfPerpCover.
   */
  Subaccount?: number

  /** The collateral to deposit, in the exchange's Asset. */
  Amount: Amount | MPTAmount

  Flags?: number | MarginDepositFlagsInterface
}

/**
 * Verify the form and type of a {@link MarginDeposit} at runtime.
 *
 * @param tx - A {@link MarginDeposit} Transaction.
 * @throws When the {@link MarginDeposit} is malformed.
 */
export function validateMarginDeposit(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'ExchangeID', isLedgerEntryId)
  validateOptionalField(tx, 'Subaccount', isNumber)
  validateRequiredField(tx, 'Amount', isAmount)

  if (
    hasFlag(tx, MarginDepositFlags.tfPerpCover, 'tfPerpCover') &&
    tx.Subaccount !== undefined
  ) {
    throw new ValidationError(
      'MarginDeposit: Subaccount must be absent with tfPerpCover',
    )
  }
}
