import { ValidationError } from '../../errors'
import { INTEGER_SANITY_CHECK } from '../utils'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isString,
  validateBaseTransaction,
  areAddressesEqual,
} from './common'

/**
 * Flags for the SponsorshipSet transaction.
 *
 * @category Transaction Flags
 */
export enum SponsorshipSetFlags {
  /**
   * Set the lsfSponsorshipRequireSignForFee flag on the Sponsorship object.
   * When set, requires the sponsee to sign any transaction where the sponsor pays the fee.
   */
  tfSponsorshipSetRequireSignForFee = 0x00010000,
  /**
   * Clear the lsfSponsorshipRequireSignForFee flag on the Sponsorship object.
   */
  tfSponsorshipClearRequireSignForFee = 0x00020000,
  /**
   * Set the lsfSponsorshipRequireSignForReserve flag on the Sponsorship object.
   * When set, requires the sponsee to sign any transaction where the sponsor pays for reserves.
   */
  tfSponsorshipSetRequireSignForReserve = 0x00040000,
  /**
   * Clear the lsfSponsorshipRequireSignForReserve flag on the Sponsorship object.
   */
  tfSponsorshipClearRequireSignForReserve = 0x00080000,
  /**
   * Delete the Sponsorship object instead of creating or modifying it.
   */
  tfDeleteObject = 0x00100000,
}

/**
 * Map of flags to boolean values representing the SponsorshipSet transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface SponsorshipSetFlagsInterface extends GlobalFlagsInterface {
  /**
   * Set the lsfSponsorshipRequireSignForFee flag on the Sponsorship object.
   */
  tfSponsorshipSetRequireSignForFee?: boolean
  /**
   * Clear the lsfSponsorshipRequireSignForFee flag on the Sponsorship object.
   */
  tfSponsorshipClearRequireSignForFee?: boolean
  /**
   * Set the lsfSponsorshipRequireSignForReserve flag on the Sponsorship object.
   */
  tfSponsorshipSetRequireSignForReserve?: boolean
  /**
   * Clear the lsfSponsorshipRequireSignForReserve flag on the Sponsorship object.
   */
  tfSponsorshipClearRequireSignForReserve?: boolean
  /**
   * Delete the Sponsorship object instead of creating or modifying it.
   */
  tfDeleteObject?: boolean
}

/**
 * A SponsorshipSet transaction creates, modifies, or deletes a Sponsorship
 * object that defines a sponsorship relationship between two accounts.
 *
 * The sponsor (Account) or sponsee (via CounterpartySponsor) can submit this
 * transaction to establish or modify the sponsorship relationship.
 *
 * @category Transaction Models
 */
export interface SponsorshipSet extends BaseTransaction {
  TransactionType: 'SponsorshipSet'
  /**
   * The account to be sponsored. This is the account that will benefit from
   * the sponsorship (fees and/or reserves paid by the sponsor).
   * Required when Account is the sponsor; omitted when using CounterpartySponsor.
   */
  Sponsee?: string
  /**
   * (Optional) The sponsor's address. Used when the sponsee (Account) is
   * submitting the transaction to accept or request a sponsorship. When present,
   * this field identifies the sponsor, and Account is the sponsee.
   */
  CounterpartySponsor?: string
  /**
   * (Optional) The amount of XRP (in drops) to pre-fund for paying transaction
   * fees on behalf of the sponsee. This creates a balance that gets decremented
   * as the sponsor pays fees.
   */
  FeeAmount?: string
  /**
   * The maximum fee (in drops) that the sponsor is willing to pay per
   * transaction on behalf of the sponsee. If not specified, there is no
   * per-transaction limit.
   */
  MaxFee?: string
  /**
   * (Optional) The number of reserve units the sponsor agrees to cover.
   * Used when establishing reserve-based sponsorship.
   */
  ReserveCount?: number
  Flags?: number | SponsorshipSetFlagsInterface
}

/**
 * Verify the form and type of a SponsorshipSet at runtime.
 *
 * @param tx - A SponsorshipSet Transaction.
 * @throws Malformed.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- necessary for validation
export function validateSponsorshipSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  // Either Sponsee or CounterpartySponsor must be present, but not both
  const hasSponsee = tx.Sponsee !== undefined
  const hasCounterpartySponsor = tx.CounterpartySponsor !== undefined

  if (!hasSponsee && !hasCounterpartySponsor) {
    throw new ValidationError(
      'SponsorshipSet: must have either Sponsee or CounterpartySponsor',
    )
  }

  if (hasSponsee && hasCounterpartySponsor) {
    throw new ValidationError(
      'SponsorshipSet: cannot have both Sponsee and CounterpartySponsor',
    )
  }

  // Validate Sponsee if present
  if (hasSponsee) {
    if (!isString(tx.Sponsee)) {
      throw new ValidationError('SponsorshipSet: Sponsee must be a string')
    }

    // Check identity before validating address format
    if (isString(tx.Account) && areAddressesEqual(tx.Account, tx.Sponsee)) {
      throw new ValidationError(
        'SponsorshipSet: Account and Sponsee cannot be the same',
      )
    }

    if (!isAccount(tx.Sponsee)) {
      throw new ValidationError(
        'SponsorshipSet: Sponsee must be a valid account address',
      )
    }
  }

  // Validate CounterpartySponsor if present
  if (hasCounterpartySponsor) {
    if (!isString(tx.CounterpartySponsor)) {
      throw new ValidationError(
        'SponsorshipSet: CounterpartySponsor must be a string',
      )
    }

    // Check identity before validating address format
    if (
      isString(tx.Account) &&
      areAddressesEqual(tx.Account, tx.CounterpartySponsor)
    ) {
      throw new ValidationError(
        'SponsorshipSet: Account and CounterpartySponsor cannot be the same',
      )
    }

    if (!isAccount(tx.CounterpartySponsor)) {
      throw new ValidationError(
        'SponsorshipSet: CounterpartySponsor must be a valid account address',
      )
    }
  }

  // Validate FeeAmount if present
  if (tx.FeeAmount !== undefined) {
    if (!isString(tx.FeeAmount)) {
      throw new ValidationError('SponsorshipSet: FeeAmount must be a string')
    }

    // Use strict regex to reject non-canonical strings (whitespace, scientific notation, decimals, etc.)
    if (!INTEGER_SANITY_CHECK.exec(tx.FeeAmount)) {
      throw new ValidationError(
        'SponsorshipSet: FeeAmount must be a non-negative numeric string',
      )
    }
  }

  // Validate MaxFee if present
  if (tx.MaxFee !== undefined) {
    if (!isString(tx.MaxFee)) {
      throw new ValidationError('SponsorshipSet: MaxFee must be a string')
    }

    // Use strict regex to reject non-canonical strings (whitespace, scientific notation, decimals, etc.)
    if (!INTEGER_SANITY_CHECK.exec(tx.MaxFee)) {
      throw new ValidationError(
        'SponsorshipSet: MaxFee must be a non-negative numeric string',
      )
    }
  }

  // Validate ReserveCount if present
  if (tx.ReserveCount !== undefined) {
    if (typeof tx.ReserveCount !== 'number') {
      throw new ValidationError('SponsorshipSet: ReserveCount must be a number')
    }

    if (tx.ReserveCount < 0 || !Number.isInteger(tx.ReserveCount)) {
      throw new ValidationError(
        'SponsorshipSet: ReserveCount must be a non-negative integer',
      )
    }

    // Prevent overflow - UInt32 max value
    const MAX_UINT32 = 4294967295
    if (tx.ReserveCount > MAX_UINT32) {
      throw new ValidationError(
        `SponsorshipSet: ReserveCount cannot exceed ${MAX_UINT32}`,
      )
    }
  }
}
