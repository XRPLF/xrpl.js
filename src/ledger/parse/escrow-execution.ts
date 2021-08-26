import * as assert from "assert";

import { removeUndefined } from "../../utils";

import { parseMemos } from "./utils";

function parseEscrowExecution(tx: any): object {
  assert.ok(tx.TransactionType === "EscrowFinish");

  return removeUndefined({
    memos: parseMemos(tx),
    owner: tx.Owner,
    escrowSequence: tx.OfferSequence,
    condition: tx.Condition,
    fulfillment: tx.Fulfillment,
  });
}

export default parseEscrowExecution;
