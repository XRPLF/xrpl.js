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
  // eslint-disable-next-line no-bitwise -- Flags require bitwise operations
  return (checkFlag & Flags) === checkFlag
}

/**
 * Sets a transaction's flags to its numeric representation.
 *
 * @param tx - A transaction to set its flags to its numeric representation.
 * @returns
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
      tx.Flags = convertOfferCreateFlagsToNumber(tx.Flags as OfferCreateFlags)
      return
    case 'PaymentChannelClaim':
      tx.Flags = convertPaymentChannelClaimFlagsToNumber(
        tx.Flags as PaymentChannelClaimFlags,
      )
      return
    case 'Payment':
      tx.Flags = convertPaymentTransactionFlagsToNumber(
        tx.Flags as PaymentTransactionFlags,
      )
      return
    case 'TrustSet':
      tx.Flags = convertTrustSetFlagsToNumber(tx.Flags as TrustSetFlags)
      return
    default:
      tx.Flags = 0
  }
}

function convertOfferCreateFlagsToNumber(flags: OfferCreateFlags): number {
  let resultFlags = 0

  if (flags.tfPassive) {
    resultFlags |= OfferCreateFlagsEnum.tfPassive
  }
  if (flags.tfImmediateOrCancel) {
    resultFlags |= OfferCreateFlagsEnum.tfImmediateOrCancel
  }
  if (flags.tfFillOrKill) {
    resultFlags |= OfferCreateFlagsEnum.tfFillOrKill
  }
  if (flags.tfSell) {
    resultFlags |= OfferCreateFlagsEnum.tfSell
  }

  return resultFlags
}

function convertPaymentChannelClaimFlagsToNumber(
  flags: PaymentChannelClaimFlags,
): number {
  let resultFlags = 0

  if (flags.tfRenew) {
    resultFlags |= PaymentChannelClaimFlagsEnum.tfRenew
  }
  if (flags.tfClose) {
    resultFlags |= PaymentChannelClaimFlagsEnum.tfClose
  }

  return resultFlags
}

function convertPaymentTransactionFlagsToNumber(
  flags: PaymentTransactionFlags,
): number {
  let resultFlags = 0

  if (flags.tfNoDirectRipple) {
    resultFlags |= PaymentTransactionFlagsEnum.tfNoDirectRipple
  }
  if (flags.tfPartialPayment) {
    resultFlags |= PaymentTransactionFlagsEnum.tfPartialPayment
  }
  if (flags.tfLimitQuality) {
    resultFlags |= PaymentTransactionFlagsEnum.tfLimitQuality
  }

  return resultFlags
}

function convertTrustSetFlagsToNumber(flags: TrustSetFlags): number {
  let resultFlags = 0

  if (flags.tfSetfAuth) {
    resultFlags |= TrustSetFlagsEnum.tfSetfAuth
  }
  if (flags.tfSetNoRipple) {
    resultFlags |= TrustSetFlagsEnum.tfSetNoRipple
  }
  if (flags.tfClearNoRipple) {
    resultFlags |= TrustSetFlagsEnum.tfClearNoRipple
  }
  if (flags.tfSetFreeze) {
    resultFlags |= TrustSetFlagsEnum.tfSetFreeze
  }
  if (flags.tfClearFreeze) {
    resultFlags |= TrustSetFlagsEnum.tfClearFreeze
  }

  return resultFlags
}
