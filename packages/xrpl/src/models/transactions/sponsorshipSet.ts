import { ValidationError } from '../../errors'
import { INTEGER_SANITY_CHECK } from '../utils'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isRecord,
  isString,
  validateBaseTransaction,
  areAddressesEqual,
} from './common'

/**
 * Matches an optionally negative, canonical integer string (no whitespace,
 * scientific notation, decimals, or leading zeros other than "0" itself).
 * Used for FeeAmountDelta, which is a signed delta rather than an absolute amount.
 */
const SIGNED_INTEGER_SANITY_CHECK = /^-?[0-9]+$/u

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
 * Flags whose presence is only valid when NOT deleting the Sponsorship
 * object (i.e. they modify the object, so they conflict with tfDeleteObject).
 */
/* eslint-disable no-bitwise -- bitwise operations required to build the flag mask */
const SPONSORSHIP_SET_MODIFY_FLAGS =
  SponsorshipSetFlags.tfSponsorshipSetRequireSignForFee |
  SponsorshipSetFlags.tfSponsorshipClearRequireSignForFee |
  SponsorshipSetFlags.tfSponsorshipSetRequireSignForReserve |
  SponsorshipSetFlags.tfSponsorshipClearRequireSignForReserve
/* eslint-enable no-bitwise */

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
 * Only the sponsor can create or modify a Sponsorship object (Account must be
 * the sponsor). CounterpartySponsor may only be used together with
 * tfDeleteObject, allowing the sponsee to delete a Sponsorship it did not
 * create by identifying the sponsor.
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
   * (Optional) The sponsor's address. Identifies the sponsor when the sponsee
   * (Account) is submitting the transaction. Only valid together with
   * tfDeleteObject; the sponsee cannot create or modify a Sponsorship, only
   * delete one.
   */
  CounterpartySponsor?: string
  /**
   * (Optional) A signed delta (in drops) to apply to the sponsorship's fee
   * allocation. A positive value tops up the balance the sponsee can draw from
   * to pay transaction fees; a negative value draws it down. The delta is
   * applied to whatever value the Sponsorship ledger entry currently holds,
   * rather than replacing it outright. Must not be zero. Must be non-negative
   * when creating a new Sponsorship (or RemainingOwnerCountDelta must be
   * positive).
   */
  FeeAmountDelta?: string
  /**
   * The maximum fee (in drops) that the sponsor is willing to pay per
   * transaction on behalf of the sponsee. Replaces (not adds to) the current
   * value. If not specified, there is no per-transaction limit.
   */
  MaxFee?: string
  /**
   * (Optional) The signed delta to apply to the Sponsorship's
   * RemainingOwnerCount (the number of reserve units the sponsor agrees to
   * cover). Must be a non-zero integer when present. Positive to add
   * coverage, negative to reduce it. Must be positive when creating a new
   * Sponsorship (or FeeAmountDelta must be positive).
   */
  RemainingOwnerCountDelta?: number
  Flags?: number | SponsorshipSetFlagsInterface
}

/**
 * Extract the SponsorshipSet flag booleans from a transaction, handling both
 * the numeric and boolean-map forms of Flags.
 *
 * @param tx - A SponsorshipSet Transaction.
 * @returns Whether tfDeleteObject is set, and whether any of the
 * RequireSignForFee/RequireSignForReserve modify flags are set.
 */
function getSponsorshipSetFlags(tx: Record<string, unknown>): {
  isDelete: boolean
  hasModifyFlag: boolean
} {
  let flagsValue = 0
  let hasModifyFlag = false

  if (typeof tx.Flags === 'number') {
    flagsValue = tx.Flags
    /* eslint-disable-next-line no-bitwise -- bitwise operations required for flag validation */
    hasModifyFlag = (tx.Flags & SPONSORSHIP_SET_MODIFY_FLAGS) !== 0
  } else if (isRecord(tx.Flags)) {
    const flagsObj = tx.Flags
    if (flagsObj.tfDeleteObject) {
      flagsValue = SponsorshipSetFlags.tfDeleteObject
    }
    /* eslint-disable @typescript-eslint/prefer-nullish-coalescing -- boolean OR; `??` would stop at an explicit `false` */
    hasModifyFlag = Boolean(
      flagsObj.tfSponsorshipSetRequireSignForFee ||
      flagsObj.tfSponsorshipClearRequireSignForFee ||
      flagsObj.tfSponsorshipSetRequireSignForReserve ||
      flagsObj.tfSponsorshipClearRequireSignForReserve,
    )
    /* eslint-enable @typescript-eslint/prefer-nullish-coalescing */
  }

  /* eslint-disable-next-line no-bitwise -- bitwise operations required for flag validation */
  const isDelete = (flagsValue & SponsorshipSetFlags.tfDeleteObject) !== 0

  return { isDelete, hasModifyFlag }
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

  const { isDelete, hasModifyFlag } = getSponsorshipSetFlags(tx)

  // CounterpartySponsor identifies the sponsee submitting the transaction.
  // Only the sponsor (Account, i.e. no CounterpartySponsor) can create or
  // modify a Sponsorship; the sponsee can only delete one.
  if (hasCounterpartySponsor && !isDelete) {
    throw new ValidationError(
      'SponsorshipSet: CounterpartySponsor can only be used with tfDeleteObject (only the sponsor can create or modify a Sponsorship)',
    )
  }

  if (isDelete) {
    if (hasModifyFlag) {
      throw new ValidationError(
        'SponsorshipSet: cannot set RequireSignForFee/RequireSignForReserve flags together with tfDeleteObject',
      )
    }

    if (
      tx.FeeAmountDelta !== undefined ||
      tx.RemainingOwnerCountDelta !== undefined ||
      tx.MaxFee !== undefined
    ) {
      throw new ValidationError(
        'SponsorshipSet: cannot include FeeAmountDelta, RemainingOwnerCountDelta, or MaxFee together with tfDeleteObject',
      )
    }
  }

  // Validate FeeAmountDelta if present (a signed delta, not an absolute value)
  if (tx.FeeAmountDelta !== undefined) {
    if (!isString(tx.FeeAmountDelta)) {
      throw new ValidationError(
        'SponsorshipSet: FeeAmountDelta must be a string',
      )
    }

    // Use strict regex to reject non-canonical strings (whitespace, scientific notation, decimals, etc.)
    // FeeAmountDelta is a signed delta and may be negative.
    if (!SIGNED_INTEGER_SANITY_CHECK.exec(tx.FeeAmountDelta)) {
      throw new ValidationError(
        'SponsorshipSet: FeeAmountDelta must be a numeric string',
      )
    }

    if (BigInt(tx.FeeAmountDelta) === BigInt(0)) {
      throw new ValidationError(
        'SponsorshipSet: FeeAmountDelta must not be zero',
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

  // Validate RemainingOwnerCountDelta if present
  if (tx.RemainingOwnerCountDelta !== undefined) {
    if (typeof tx.RemainingOwnerCountDelta !== 'number') {
      throw new ValidationError(
        'SponsorshipSet: RemainingOwnerCountDelta must be a number',
      )
    }

    if (!Number.isInteger(tx.RemainingOwnerCountDelta)) {
      throw new ValidationError(
        'SponsorshipSet: RemainingOwnerCountDelta must be an integer',
      )
    }

    if (tx.RemainingOwnerCountDelta === 0) {
      throw new ValidationError(
        'SponsorshipSet: RemainingOwnerCountDelta must be non-zero when present',
      )
    }

    // INT32 range
    const MIN_INT32 = -2147483648
    const MAX_INT32 = 2147483647
    if (
      tx.RemainingOwnerCountDelta > MAX_INT32 ||
      tx.RemainingOwnerCountDelta < MIN_INT32
    ) {
      throw new ValidationError(
        `SponsorshipSet: RemainingOwnerCountDelta must be between ${MIN_INT32} and ${MAX_INT32}`,
      )
    }
  }

  if (
    !isDelete &&
    tx.FeeAmountDelta === undefined &&
    tx.RemainingOwnerCountDelta === undefined &&
    tx.MaxFee === undefined &&
    !hasModifyFlag
  ) {
    throw new ValidationError(
      'SponsorshipSet: must specify at least one of FeeAmountDelta, RemainingOwnerCountDelta, MaxFee, or a RequireSignFor flag',
    )
  }
}
