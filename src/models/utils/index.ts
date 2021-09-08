/* eslint-disable no-param-reassign -- param reassign is safe */
/* eslint-disable no-bitwise -- flags require bitwise operations */
import { ValidationError } from '../../common/errors'
// eslint-disable-next-line import/no-cycle -- cycle is safe
import {
  OfferCreateFlags,
  OfferCreateFlagsEnum,
  PaymentChannelClaimFlags,
  PaymentChannelClaimFlagsEnum,
  PaymentTransactionFlags,
  PaymentTransactionFlagsEnum,
  Transaction,
  TrustSetFlags,
  TrustSetFlagsEnum,
} from '../transactions'
import type { GlobalFlags } from '../transactions/common'

/**
 * Verify that all fields of an object are in fields.
 *
 * @param obj - Object to verify fields.
 * @param fields - Fields to verify.
 * @returns True if keys in object are all in fields.
 */
export function onlyHasFields(
  obj: Record<string, unknown>,
  fields: string[],
): boolean {
  return Object.keys(obj).every((key: string) => fields.includes(key))
}

/**
 * Perform bitwise AND (&) to check if a flag is enabled within Flags (as a number).
 *
 * @param Flags - A number that represents flags enabled.
 * @param checkFlag - A specific flag to check if it's enabled within Flags.
 * @returns True if checkFlag is enabled within Flags.
 */
export function isFlagEnabled(Flags: number, checkFlag: number): boolean {
  return (checkFlag & Flags) === checkFlag
}

/**
 * Sets a transaction's flags to its numeric representation.
 *
 * @param tx - A transaction to set its flags to its numeric representation.
 */
export function setTransactionFlagsToNumber(tx: Transaction): void {
  if (tx.Flags == null) {
    tx.Flags = 0
    return
  }
  if (typeof tx.Flags === 'number') {
    return
  }

  switch (tx.TransactionType) {
    case 'OfferCreate':
      tx.Flags = convertOfferCreateFlagsToNumber(tx.Flags)
      return
    case 'PaymentChannelClaim':
      tx.Flags = convertPaymentChannelClaimFlagsToNumber(tx.Flags)
      return
    case 'Payment':
      tx.Flags = convertPaymentTransactionFlagsToNumber(tx.Flags)
      return
    case 'TrustSet':
      tx.Flags = convertTrustSetFlagsToNumber(tx.Flags)
      return
    default:
      tx.Flags = 0
  }
}

function convertOfferCreateFlagsToNumber(flags: OfferCreateFlags): number {
  return reduceFlags(flags, OfferCreateFlagsEnum)
}

function convertPaymentChannelClaimFlagsToNumber(
  flags: PaymentChannelClaimFlags,
): number {
  return reduceFlags(flags, PaymentChannelClaimFlagsEnum)
}

function convertPaymentTransactionFlagsToNumber(
  flags: PaymentTransactionFlags,
): number {
  return reduceFlags(flags, PaymentTransactionFlagsEnum)
}

function convertTrustSetFlagsToNumber(flags: TrustSetFlags): number {
  return reduceFlags(flags, TrustSetFlagsEnum)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- added ValidationError check for flagEnum
function reduceFlags(flags: GlobalFlags, flagEnum: any): number {
  return Object.keys(flags).reduce((resultFlags, flag) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe member access
    if (flagEnum[flag] == null) {
      throw new ValidationError(
        `flag ${flag} doesn't exist in flagEnum: ${JSON.stringify(flagEnum)}`,
      )
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- safe member access
    return flags[flag] ? resultFlags | flagEnum[flag] : resultFlags
  }, 0)
}
