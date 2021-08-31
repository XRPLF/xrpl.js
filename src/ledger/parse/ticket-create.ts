import * as assert from "assert";

import { removeUndefined } from "../../utils";

import { parseMemos } from "./utils";

function parseTicketCreate(tx: any): object {
  assert.ok(tx.TransactionType === "TicketCreate");
  return removeUndefined({
    memos: parseMemos(tx),
    ticketCount: tx.TicketCount,
  });
}

export default parseTicketCreate;
