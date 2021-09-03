import type { Client } from "..";

import { Instructions, Prepare, TransactionJSON } from "./types";
import { prepareTransaction } from "./utils";

export interface CheckCancelParameters {
  checkID: string;
}

function createCheckCancelTransaction(
  account: string,
  cancel: CheckCancelParameters
): TransactionJSON {
  const txJSON = {
    Account: account,
    TransactionType: "CheckCancel",
    CheckID: cancel.checkID,
  };

  return txJSON;
}

async function prepareCheckCancel(
  this: Client,
  address: string,
  checkCancel: CheckCancelParameters,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    const txJSON = createCheckCancelTransaction(address, checkCancel);
    return await prepareTransaction(txJSON, this, instructions);
  } catch (e) {
    return Promise.reject(e);
  }
}

export default prepareCheckCancel;
