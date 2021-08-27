import { ValidationError } from "../../common/errors";
import { Amount, Path } from "../common";
import { isFlagEnabled } from "../utils";

import {
  BaseTransaction,
  isAmount,
  GlobalFlags,
  verifyBaseTransaction,
} from "./common";

export enum PaymentTransactionFlagsEnum {
  tfNoDirectRipple = 0x00010000,
  tfPartialPayment = 0x00020000,
  tfLimitQuality = 0x00040000,
}

export interface PaymentTransactionFlags extends GlobalFlags {
  tfNoDirectRipple?: boolean;
  tfPartialPayment?: boolean;
  tfLimitQuality?: boolean;
}
export interface PaymentTransaction extends BaseTransaction {
  TransactionType: "Payment";
  Amount: Amount;
  Destination: string;
  DestinationTag?: number;
  InvoiceID?: string;
  Paths?: Path[];
  SendMax?: Amount;
  DeliverMin?: Amount;
  Flags?: number | PaymentTransactionFlags;
}

/**
 * @param tx - A Payment Transaction.
 * @returns
 * @throws {ValidationError} When the PaymentTransaction is malformed.
 */
export function verifyPaymentTransaction(tx: PaymentTransaction): void {
  verifyBaseTransaction(tx);

  if (tx.Amount === undefined) {
    throw new ValidationError("PaymentTransaction: missing field Amount");
  }

  if (!isAmount(tx.Amount)) {
    throw new ValidationError("PaymentTransaction: invalid Amount");
  }

  if (tx.Destination === undefined) {
    throw new ValidationError("PaymentTransaction: missing field Destination");
  }

  if (!isAmount(tx.Destination)) {
    throw new ValidationError("PaymentTransaction: invalid Destination");
  }

  if (
    tx.DestinationTag !== undefined &&
    typeof tx.DestinationTag !== "number"
  ) {
    throw new ValidationError(
      "PaymentTransaction: DestinationTag must be a number"
    );
  }

  if (tx.InvoiceID !== undefined && typeof tx.InvoiceID !== "string") {
    throw new ValidationError("PaymentTransaction: InvoiceID must be a string");
  }

  if (tx.Paths !== undefined && !isPaths(tx.Paths)) {
    throw new ValidationError("PaymentTransaction: invalid Paths");
  }

  if (tx.SendMax !== undefined && !isAmount(tx.SendMax)) {
    throw new ValidationError("PaymentTransaction: invalid SendMax");
  }

  if (tx.DeliverMin !== undefined) {
    const isTfPartialPayment =
      typeof tx.Flags === "number"
        ? isFlagEnabled(tx.Flags, PaymentTransactionFlagsEnum.tfPartialPayment)
        : tx.Flags?.tfPartialPayment ?? false;

    if (!isTfPartialPayment) {
      throw new ValidationError(
        "PaymentTransaction: tfPartialPayment flag required with DeliverMin"
      );
    }

    if (!isAmount(tx.DeliverMin)) {
      throw new ValidationError("PaymentTransaction: invalid DeliverMin");
    }
  }
}

function isPaths(paths: Path[]): boolean {
  if (!Array.isArray(paths) || paths.length === 0) {
    return false;
  }

  for (const i in paths) {
    const path = paths[i];
    if (!Array.isArray(path) || path.length === 0) {
      return false;
    }

    for (const j in path) {
      const pathStep = path[j];
      const { account, currency, issuer } = pathStep;
      if (
        (account !== undefined && typeof account !== "string") ||
        (currency !== undefined && typeof currency !== "string") ||
        (issuer !== undefined && typeof issuer !== "string")
      ) {
        return false;
      }
    }
  }

  return true;
}
