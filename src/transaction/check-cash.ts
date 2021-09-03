import { Client } from "..";
import { ValidationError } from "../common/errors";
import { Amount } from "../common/types/objects";
import { toRippledAmount } from "../utils";

import { Instructions, Prepare, TransactionJSON } from "./types";
import * as utils from "./utils";

export interface CheckCashParameters {
  checkID: string;
  amount?: Amount;
  deliverMin?: Amount;
}

function createCheckCashTransaction(
  account: string,
  checkCash: CheckCashParameters
): TransactionJSON {
  if (checkCash.amount && checkCash.deliverMin) {
    throw new ValidationError(
      '"amount" and "deliverMin" properties on ' +
        "CheckCash are mutually exclusive"
    );
  }

  const txJSON: any = {
    Account: account,
    TransactionType: "CheckCash",
    CheckID: checkCash.checkID,
  };

  if (checkCash.amount != null) {
    txJSON.Amount = toRippledAmount(checkCash.amount);
  }

  if (checkCash.deliverMin != null) {
    txJSON.DeliverMin = toRippledAmount(checkCash.deliverMin);
  }

  return txJSON;
}

async function prepareCheckCash(
  this: Client,
  address: string,
  checkCash: CheckCashParameters,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    const txJSON = createCheckCashTransaction(address, checkCash);
    return await utils.prepareTransaction(txJSON, this, instructions);
  } catch (e) {
    return Promise.reject(e);
  }
}

export default prepareCheckCash;
