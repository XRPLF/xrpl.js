import { ValidationError } from "../../common/errors";

import { BaseTransaction, verifyBaseTransaction } from "./common";

export interface SetRegularKey extends BaseTransaction {
  TransactionType: "SetRegularKey";
  RegularKey?: string;
}

/**
 * @param tx - A Payment Transaction.
 * @returns
 * @throws {ValidationError} When the SetRegularKey is malformed.
 */
export function verifySetRegularKey(tx: SetRegularKey): void {
  verifyBaseTransaction(tx);

  if (tx.RegularKey !== undefined && typeof tx.RegularKey !== "string") {
    throw new ValidationError("SetRegularKey: RegularKey must be a string");
  }
}
