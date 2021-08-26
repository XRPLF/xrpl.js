import * as assert from "assert";

import { removeUndefined } from "../../utils";

import { parseMemos } from "./utils";

export interface FormattedCheckCancel {
  // ID of the Check ledger object to cancel.
  checkID: string;
}

function parseCheckCancel(tx: any): FormattedCheckCancel {
  assert.ok(tx.TransactionType === "CheckCancel");

  return removeUndefined({
    memos: parseMemos(tx),
    checkID: tx.CheckID,
  });
}

export default parseCheckCancel;
