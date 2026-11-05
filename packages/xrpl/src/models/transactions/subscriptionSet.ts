import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'
import { hasFlag, INTEGER_SANITY_CHECK } from '../utils'

import {
  Account,
  BaseTransaction,
  GlobalFlagsInterface,
  areAddressesEqual,
  isAccount,
  isAmount,
  isIssuedCurrencyAmount,
  isLedgerEntryId,
  isMPTAmount,
  isNumber,
  isString,
  MAX_MPT_AMOUNT,
  MAX_XRP_DROPS,
  validateBaseTransaction,
  validateFlagsMask,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Enum representing values of {@link SubscriptionSet} transaction flags.
 *
 * @category Transaction Flags
 */
export enum SubscriptionSetFlags {
  /**
   * Delete the Subscription on its first successful claim. Only allowed when
   * the Subscription is created.
   */
  tfSingleUse = 0x00010000,
}

/**
 * Map of flags to boolean values representing {@link SubscriptionSet}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export interface SubscriptionSetFlagsInterface extends GlobalFlagsInterface {
  tfSingleUse?: boolean
}

/**
 * The SubscriptionSet transaction creates a Subscription that lets its
 * Destination claim up to Amount every Frequency seconds, or updates the
 * Amount, Frequency or Expiration of an existing one.
 *
 * @category Transaction Models
 */
export interface SubscriptionSet extends BaseTransaction {
  TransactionType: 'SubscriptionSet'

  /**
   * The account that may claim from the Subscription. Required to create a
   * Subscription; not allowed on an update.
   */
  Destination?: Account

  /**
   * The most the Destination may claim per period (XRP, IOU or MPT).
   */
  Amount: Amount | MPTAmount

  /**
   * The length of a claim period, in seconds; 0 makes the Subscription
   * unmetered. Required to create a Subscription.
   */
  Frequency?: number

  /**
   * The time, in seconds since the Ripple Epoch, of the first claim period.
   * Not allowed on an update.
   */
  StartTime?: number

  /**
   * The time, in seconds since the Ripple Epoch, after which the Subscription
   * can no longer be claimed. On an update, 0 removes the expiration.
   */
  Expiration?: number

  /**
   * The destination tag of the Destination.
   */
  DestinationTag?: number

  /**
   * The ID of the Subscription to update. Absent on a create.
   */
  SubscriptionID?: string

  Flags?: number | SubscriptionSetFlagsInterface
}

/**
 * Check whether a string is a positive integer no larger than a maximum.
 *
 * @param value - The string to check.
 * @param max - The largest allowed value.
 * @returns Whether the value is an integer string in [1, max].
 */
function isPositiveIntegerUpTo(value: string, max: bigint): boolean {
  return (
    INTEGER_SANITY_CHECK.test(value) &&
    BigInt(value) > BigInt(0) &&
    BigInt(value) <= max
  )
}

/**
 * Check the Amount rules of the node's SubscriptionSet preflight.
 *
 * @param amount - The Amount of a SubscriptionSet.
 * @returns Whether the Amount is a positive legal XRP, IOU or MPT amount.
 */
function isValidSubscriptionAmount(amount: unknown): boolean {
  if (isString(amount)) {
    return isPositiveIntegerUpTo(amount, MAX_XRP_DROPS)
  }
  if (isMPTAmount(amount)) {
    return isPositiveIntegerUpTo(amount.value, MAX_MPT_AMOUNT)
  }
  return (
    isIssuedCurrencyAmount(amount) &&
    amount.currency !== 'XRP' &&
    Number(amount.value) > 0
  )
}

/**
 * Verify the fields of a SubscriptionSet that creates a Subscription.
 *
 * @param tx - A SubscriptionSet Transaction without a SubscriptionID.
 * @throws When the create is malformed.
 */
function validateCreate(tx: Record<string, unknown>): void {
  if (tx.Destination === undefined || tx.Frequency === undefined) {
    throw new ValidationError(
      'SubscriptionSet: Destination and Frequency are required to create a subscription',
    )
  }
  if (
    isString(tx.Destination) &&
    isString(tx.Account) &&
    areAddressesEqual(tx.Destination, tx.Account)
  ) {
    throw new ValidationError(
      'SubscriptionSet: Destination must not be the Account',
    )
  }
}

/**
 * Verify the fields of a SubscriptionSet that updates a Subscription.
 *
 * @param tx - A SubscriptionSet Transaction with a SubscriptionID.
 * @throws When the update is malformed.
 */
function validateUpdate(tx: Record<string, unknown>): void {
  if (tx.Destination !== undefined || tx.StartTime !== undefined) {
    throw new ValidationError(
      'SubscriptionSet: Destination and StartTime cannot be changed on update',
    )
  }
  if (hasFlag(tx, SubscriptionSetFlags.tfSingleUse, 'tfSingleUse')) {
    throw new ValidationError(
      'SubscriptionSet: tfSingleUse cannot be set on update',
    )
  }
}

/**
 * Verify the form and type of a {@link SubscriptionSet} at runtime.
 *
 * @param tx - A {@link SubscriptionSet} Transaction.
 * @throws When the {@link SubscriptionSet} is malformed.
 */
export function validateSubscriptionSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx, SubscriptionSetFlags)

  validateOptionalField(tx, 'Destination', isAccount)
  validateRequiredField(tx, 'Amount', isAmount)
  validateOptionalField(tx, 'Frequency', isNumber)
  validateOptionalField(tx, 'StartTime', isNumber)
  validateOptionalField(tx, 'Expiration', isNumber)
  validateOptionalField(tx, 'DestinationTag', isNumber)
  validateOptionalField(tx, 'SubscriptionID', isLedgerEntryId)

  if (tx.SubscriptionID === undefined) {
    validateCreate(tx)
  } else {
    validateUpdate(tx)
  }

  if (!isValidSubscriptionAmount(tx.Amount)) {
    throw new ValidationError(
      `SubscriptionSet: Amount must be a positive XRP amount of at most ${MAX_XRP_DROPS.toString()} drops, a positive IOU amount not in XRP, or a positive MPT amount of at most ${MAX_MPT_AMOUNT.toString()}`,
    )
  }
}
