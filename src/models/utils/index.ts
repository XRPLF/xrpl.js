import { OfferCreateFlags, OfferCreateFlagsEnum, PaymentChannelClaimFlags, PaymentChannelClaimFlagsEnum, PaymentTransactionFlags, PaymentTransactionFlagsEnum, Transaction, TrustSetFlags, TrustSetFlagsEnum } from "../transactions";
import { GlobalFlags, GlobalFlagsEnum } from "../transactions/common";

/**
 * Verify that all fields of an object are in fields.
 *
 * @param obj - Object to verify fields.
 * @param fields - Fields to verify.
 * @returns True if keys in object are all in fields.
 */
export function onlyHasFields(obj: object, fields: string[]): boolean {
  return Object.keys(obj).every((key: string) => fields.includes(key));
}

/**
 * Perform bitwise AND (&) to check if a flag is enabled within Flags (as a number).
 *
 * @param Flags - A number that represents flags enabled.
 * @param checkFlag - A specific flag to check if it's enabled within Flags.
 * @returns True if checkFlag is enabled within Flags.
 */
export function isFlagEnabled(Flags: number, checkFlag: number): boolean {
  return (checkFlag & Flags) === checkFlag;
}

/**
 * Sets a transaction's flags to its numeric representation
 *
 * @param {Transaction} tx A transaction to set its flags to its numeric representation
 * @returns {void}
 */
export function setTransactionFlagsToNumber(tx: Transaction): void {
  switch (tx.TransactionType) {
    case 'OfferCreate':
      tx.Flags = convertOfferCreateFlagsToNumber(tx.Flags as OfferCreateFlags);
      break;
    case 'PaymentChannelClaim':
      tx.Flags = convertPaymentChannelClaimFlagsToNumber(tx.Flags as PaymentChannelClaimFlags);
      break;
    case 'Payment':
      tx.Flags = convertPaymentTransactionFlagsToNumber(tx.Flags as PaymentTransactionFlags);
      break;
    case 'TrustSet':
      tx.Flags = convertTrustSetFlagsToNumber(tx.Flags as TrustSetFlags);
      break;
    default:
      tx.Flags = convertGlobalFlagsToNumber(tx.Flags);
  }
}

function convertGlobalFlagsToNumber(flags: GlobalFlags | number | undefined): number {
  if (typeof flags === 'number') {
    return flags;
  }
  return flags?.tfFullyCanonicalSig ? GlobalFlagsEnum.tfFullyCanonicalSig : 0;
}

function convertOfferCreateFlagsToNumber(flags: OfferCreateFlags): number {
  if (flags === undefined) {
    return 0;
  } else if (typeof flags === 'number') {
    return flags;
  }

  let resultFlags = convertGlobalFlagsToNumber(flags);

  if (flags.tfPassive) {
    resultFlags |= OfferCreateFlagsEnum.tfPassive;
  }
  if (flags.tfImmediateOrCancel) {
    resultFlags |= OfferCreateFlagsEnum.tfImmediateOrCancel;
  }
  if (flags.tfFillOrKill) {
    resultFlags |= OfferCreateFlagsEnum.tfFillOrKill;
  }
  if (flags.tfSell) {
    resultFlags |= OfferCreateFlagsEnum.tfSell;
  }

  return resultFlags;
}

function convertPaymentChannelClaimFlagsToNumber(flags: PaymentChannelClaimFlags): number {
  if (flags === undefined) {
    return 0;
  } else if (typeof flags === 'number') {
    return flags;
  }

  let resultFlags = convertGlobalFlagsToNumber(flags);

  if (flags.tfRenew) {
    resultFlags |= PaymentChannelClaimFlagsEnum.tfRenew;
  }
  if (flags.tfClose) {
    resultFlags |= PaymentChannelClaimFlagsEnum.tfClose;
  }

  return resultFlags;
}

function convertPaymentTransactionFlagsToNumber(flags: PaymentTransactionFlags): number {
  if (flags === undefined) {
    return 0;
  } else if (typeof flags === 'number') {
    return flags;
  }

  let resultFlags = convertGlobalFlagsToNumber(flags);

  if (flags.tfNoDirectRipple) {
    resultFlags |= PaymentTransactionFlagsEnum.tfNoDirectRipple;
  }
  if (flags.tfPartialPayment) {
    resultFlags |= PaymentTransactionFlagsEnum.tfPartialPayment;
  }
  if (flags.tfLimitQuality) {
    resultFlags |= PaymentTransactionFlagsEnum.tfLimitQuality;
  }

  return resultFlags;
}

function convertTrustSetFlagsToNumber(flags: TrustSetFlags): number {
  if (flags === undefined) {
    return 0;
  } else if (typeof flags === 'number') {
    return flags;
  }

  let resultFlags = convertGlobalFlagsToNumber(flags);

  if (flags.tfSetfAuth) {
    resultFlags |= TrustSetFlagsEnum.tfSetfAuth;
  }
  if (flags.tfSetNoRipple) {
    resultFlags |= TrustSetFlagsEnum.tfSetNoRipple;
  }
  if (flags.tfClearNoRipple) {
    resultFlags |= TrustSetFlagsEnum.tfClearNoRipple;
  }
  if (flags.tfSetFreeze) {
    resultFlags |= TrustSetFlagsEnum.tfSetFreeze;
  }
  if (flags.tfClearFreeze) {
    resultFlags |= TrustSetFlagsEnum.tfClearFreeze;
  }

  return resultFlags;
}
