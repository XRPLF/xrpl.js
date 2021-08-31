import { ValidationError } from "../../common/errors";

import { BaseTransaction, verifyBaseTransaction } from "./common";

export interface TicketCreate extends BaseTransaction {
  TransactionType: "TicketCreate";
  TicketCount: number;
}

const MAX_TICKETS = 250;

/**
 * Verify the form and type of a TicketCreate at runtime.
 *
 * @param tx - A TicketCreate Transaction.
 * @throws When the TicketCreate is malformed.
 */
export function verifyTicketCreate(tx: Record<string, unknown>): void {
  verifyBaseTransaction(tx);
  const { TicketCount } = tx;

  if (TicketCount === undefined) {
    throw new ValidationError("TicketCreate: missing field TicketCount");
  }

  if (typeof TicketCount !== "number") {
    throw new ValidationError("TicketCreate: TicketCount must be a number");
  }

  if (
    !Number.isInteger(TicketCount) ||
    TicketCount < 1 ||
    TicketCount > MAX_TICKETS
  ) {
    throw new ValidationError(
      "TicketCreate: TicketCount must be an integer from 1 to 250"
    );
  }
}
