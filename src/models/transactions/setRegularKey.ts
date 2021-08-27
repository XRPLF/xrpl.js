import { ValidationError } from "../../common/errors";

import { BaseTransaction, verifyBaseTransaction } from "./common";

export interface SetRegularKey extends BaseTransaction {
  TransactionType: "SetRegularKey";
  RegularKey?: string;
}

/**
 * Verify the form and type of a SetRegularKey at runtime.
 *
 * @param tx - A SetRegularKey Transaction.
 * @throws When the SetRegularKey is malformed.
 */
export function verifySetRegularKey(tx: Record<string, unknown>): void {
  verifyBaseTransaction(tx);

  if (tx.RegularKey !== undefined && typeof tx.RegularKey !== "string") {
    throw new ValidationError("SetRegularKey: RegularKey must be a string");
  }
}
