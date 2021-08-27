import { ValidationError } from "../../common/errors";

import { BaseTransaction, verifyBaseTransaction } from "./common";

export interface EscrowCancel extends BaseTransaction {
  TransactionType: "EscrowCancel";
  Owner: string;
  OfferSequence: number;
}

/**
 * Verify the form and type of an EscrowCancel at runtime.
 *
 * @param tx - An EscrowCancel Transaction.
 * @throws When the EscrowCancel is Malformed.
 */
export function verifyEscrowCancel(tx: Record<string, unknown>): void {
  verifyBaseTransaction(tx);

  if (tx.Owner === undefined) {
    throw new ValidationError("EscrowCancel: missing Owner");
  }

  if (typeof tx.Owner !== "string") {
    throw new ValidationError("EscrowCancel: Owner must be a string");
  }

  if (tx.OfferSequence === undefined) {
    throw new ValidationError("EscrowCancel: missing OfferSequence");
  }

  if (typeof tx.OfferSequence !== "number") {
    throw new ValidationError("EscrowCancel: OfferSequence must be a number");
  }
}
