import { ValidationError } from "../../common/errors";

import { BaseTransaction, verifyBaseTransaction } from "./common";

export interface AccountDelete extends BaseTransaction {
  TransactionType: "AccountDelete";
  Destination: string;
  DestinationTag?: number;
}

/**
 * Verify the form and type of an AccountDelete at runtime.
 *
 * @param tx - An AccountDelete Transaction.
 * @returns Void.
 * @throws When the AccountDelete is Malformed.
 */
export function verifyAccountDelete(tx: AccountDelete): void {
  verifyBaseTransaction(tx);

  if (tx.Destination === undefined) {
    throw new ValidationError("AccountDelete: missing field Destination");
  }

  if (typeof tx.Destination !== "string") {
    throw new ValidationError("AccountDelete: invalid Destination");
  }

  if (
    tx.DestinationTag !== undefined &&
    typeof tx.DestinationTag !== "number"
  ) {
    throw new ValidationError("AccountDelete: invalid DestinationTag");
  }
}
