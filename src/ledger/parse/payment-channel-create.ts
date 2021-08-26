import * as assert from "assert";

import { removeUndefined } from "../../utils";

import parseAmount from "./amount";
import { parseTimestamp, parseMemos } from "./utils";

function parsePaymentChannelCreate(tx: any): object {
  assert.ok(tx.TransactionType === "PaymentChannelCreate");

  return removeUndefined({
    memos: parseMemos(tx),
    amount: parseAmount(tx.Amount).value,
    destination: tx.Destination,
    settleDelay: tx.SettleDelay,
    publicKey: tx.PublicKey,
    cancelAfter: tx.CancelAfter && parseTimestamp(tx.CancelAfter),
    sourceTag: tx.SourceTag,
    destinationTag: tx.DestinationTag,
  });
}

export default parsePaymentChannelCreate;
