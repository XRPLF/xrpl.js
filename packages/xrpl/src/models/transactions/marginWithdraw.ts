import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'
import { hasFlag } from '../utils'

import {
  Account,
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isAmount,
  isLedgerEntryId,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Enum representing values of {@link MarginWithdraw} transaction flags.
 *
 * @category Transaction Flags
 */
export enum MarginWithdrawFlags {
  /** The exchange owner withdraws cover. */
  tfPerpCover = 0x00010000,
  /** The exchange owner withdraws owner fees. */
  tfPerpOwnerFees = 0x00020000,
  /** Delete the margin account after the withdrawal. */
  tfPerpDeleteAccount = 0x00040000,
}

/**
 * Map of flags to boolean values representing {@link MarginWithdraw}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export interface MarginWithdrawFlagsInterface extends GlobalFlagsInterface {
  tfPerpCover?: boolean
  tfPerpOwnerFees?: boolean
  tfPerpDeleteAccount?: boolean
}

/**
 * The MarginWithdraw transaction withdraws collateral from the submitter's
 * margin account on a perpetual futures exchange, or the exchange owner's
 * cover or fees.
 *
 * @category Transaction Models
 */
export interface MarginWithdraw extends BaseTransaction {
  TransactionType: 'MarginWithdraw'

  /** The ID of the PerpExchange ledger entry to withdraw from. */
  ExchangeID: string

  /** The collateral to withdraw, in the exchange's Asset. */
  Amount: Amount | MPTAmount

  /** The account paid. Defaults to the submitting Account. */
  Destination?: Account

  Flags?: number | MarginWithdrawFlagsInterface
}

/**
 * Verify the form and type of a {@link MarginWithdraw} at runtime.
 *
 * @param tx - A {@link MarginWithdraw} Transaction.
 * @throws When the {@link MarginWithdraw} is malformed.
 */
export function validateMarginWithdraw(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'ExchangeID', isLedgerEntryId)
  validateRequiredField(tx, 'Amount', isAmount)
  validateOptionalField(tx, 'Destination', isAccount)

  const cover = hasFlag(tx, MarginWithdrawFlags.tfPerpCover, 'tfPerpCover')
  const ownerFees = hasFlag(
    tx,
    MarginWithdrawFlags.tfPerpOwnerFees,
    'tfPerpOwnerFees',
  )
  const deleteAccount = hasFlag(
    tx,
    MarginWithdrawFlags.tfPerpDeleteAccount,
    'tfPerpDeleteAccount',
  )
  if ([cover, ownerFees, deleteAccount].filter(Boolean).length > 1) {
    throw new ValidationError(
      'MarginWithdraw: at most one of tfPerpCover, tfPerpOwnerFees and tfPerpDeleteAccount may be set',
    )
  }
}
