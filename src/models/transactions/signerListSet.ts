import { ValidationError } from "../../common/errors";
import { SignerEntry } from "../common";

import { BaseTransaction, verifyBaseTransaction } from "./common";

export interface SignerListSet extends BaseTransaction {
  TransactionType: "SignerListSet";
  SignerQuorum: number;
  SignerEntries: SignerEntry[];
}

/**
 * Verify the form and type of an SignerListSet at runtime.
 *
 * @param tx - An SignerListSet Transaction.
 * @returns Void.
 * @throws When the SignerListSet is Malformed.
 */
export function verifySignerListSet(tx: SignerListSet): void {
  verifyBaseTransaction(tx);

  if (tx.SignerQuorum === undefined) {
    throw new ValidationError("SignerListSet: missing field SignerQuorum");
  }

  if (typeof tx.SignerQuorum !== "number") {
    throw new ValidationError("SignerListSet: invalid SignerQuorum");
  }

  if (tx.SignerEntries === undefined) {
    throw new ValidationError("SignerListSet: missing field SignerEntries");
  }

  if (!Array.isArray(tx.SignerEntries)) {
    throw new ValidationError("SignerListSet: invalid SignerEntries");
  }

  if (tx.SignerEntries.length === 0) {
    throw new ValidationError(
      "SignerListSet: need atleast 1 member in SignerEntries"
    );
  }

  if (tx.SignerEntries.length > 8) {
    throw new ValidationError(
      "SignerListSet: maximum of 8 members allowed in SignerEntries"
    );
  }
}
