import { ValidationError } from "../../common/errors";
import { Amount, IssuedCurrencyAmount } from "../common";

import { BaseTransaction, verifyBaseTransaction } from "./common";

export interface CheckCreate extends BaseTransaction {
  TransactionType: "CheckCreate";
  Destination: string;
  SendMax: Amount;
  DestinationTag?: number;
  Expiration?: number;
  InvoiceID?: string;
}

/**
 * Verify the form and type of an CheckCreate at runtime.
 *
 * @param tx - An CheckCreate Transaction.
 * @returns Void.
 * @throws When the CheckCreate is Malformed.
 */
export function verifyCheckCreate(tx: CheckCreate): void {
  verifyBaseTransaction(tx);

  if (tx.SendMax === undefined) {
    throw new ValidationError("CheckCreate: missing field SendMax");
  }

  if (tx.Destination === undefined) {
    throw new ValidationError("CheckCreate: missing field Destination");
  }

  const isIssuedCurrency = (obj: IssuedCurrencyAmount): boolean => {
    return (
      Object.keys(obj).length === 3 &&
      typeof obj.value === "string" &&
      typeof obj.issuer === "string" &&
      typeof obj.currency === "string"
    );
  };

  if (typeof tx.SendMax !== "string" && !isIssuedCurrency(tx.SendMax)) {
    throw new ValidationError("CheckCreate: invalid SendMax");
  }

  if (typeof tx.Destination !== "string") {
    throw new ValidationError("CheckCreate: invalid Destination");
  }

  if (
    tx.DestinationTag !== undefined &&
    typeof tx.DestinationTag !== "number"
  ) {
    throw new ValidationError("CheckCreate: invalid DestinationTag");
  }

  if (tx.Expiration !== undefined && typeof tx.Expiration !== "number") {
    throw new ValidationError("CheckCreate: invalid Expiration");
  }

  if (tx.InvoiceID !== undefined && typeof tx.InvoiceID !== "string") {
    throw new ValidationError("CheckCreate: invalid InvoiceID");
  }
}
