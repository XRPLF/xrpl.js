import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isString,
  validateBaseTransaction,
} from './common'

/**
 * Flags for the SponsorshipSet transaction.
 *
 * @category Transaction Flags
 */
export enum SponsorshipSetFlags {
  /**
   * If set, delete the Sponsorship object instead of creating or modifying it.
   */
  tfDelete = 0x00010000,
}

/**
 * Map of flags to boolean values representing the SponsorshipSet transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface SponsorshipSetFlagsInterface extends GlobalFlagsInterface {
  /**
   * If set, delete the Sponsorship object instead of creating or modifying it.
   */
  tfDelete?: boolean
}

/**
 * A SponsorshipSet transaction creates, modifies, or deletes a Sponsorship
 * object that defines a sponsorship relationship between two accounts.
 *
 * The sponsor (Account) agrees to pay fees and/or reserves on behalf of the
 * sponsee. This transaction creates a pre-funded sponsorship model where the
 * Sponsorship object exists in the ledger before sponsored transactions occur.
 *
 * @category Transaction Models
 */
export interface SponsorshipSet extends BaseTransaction {
  TransactionType: 'SponsorshipSet'
  /**
   * The account to be sponsored. This is the account that will benefit from
   * the sponsorship (fees and/or reserves paid by the sponsor).
   */
  Sponsee: string
  /**
   * The maximum fee (in drops) that the sponsor is willing to pay per
   * transaction on behalf of the sponsee. If not specified, there is no
   * per-transaction limit.
   */
  MaxFee?: string
  Flags?: number | SponsorshipSetFlagsInterface
}

/**
 * Verify the form and type of a SponsorshipSet at runtime.
 *
 * @param tx - A SponsorshipSet Transaction.
 * @throws When the SponsorshipSet is malformed.
 */
export function validateSponsorshipSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Sponsee === undefined) {
    throw new ValidationError('SponsorshipSet: missing field Sponsee')
  }

  if (!isString(tx.Sponsee)) {
    throw new ValidationError('SponsorshipSet: Sponsee must be a string')
  }

  // Check identity before validating address format
  // This ensures we get the correct error message when Account and Sponsee are the same
  if (tx.Account === tx.Sponsee) {
    throw new ValidationError(
      'SponsorshipSet: Account and Sponsee cannot be the same',
    )
  }

  if (!isAccount(tx.Sponsee)) {
    throw new ValidationError(
      'SponsorshipSet: Sponsee must be a valid account address',
    )
  }

  // Validate MaxFee if present
  if (tx.MaxFee !== undefined) {
    if (!isString(tx.MaxFee)) {
      throw new ValidationError('SponsorshipSet: MaxFee must be a string')
    }

    const maxFeeNum = Number(tx.MaxFee)
    if (Number.isNaN(maxFeeNum) || maxFeeNum < 0) {
      throw new ValidationError(
        'SponsorshipSet: MaxFee must be a non-negative numeric string',
      )
    }
  }
}
