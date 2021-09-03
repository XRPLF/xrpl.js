import { Client } from "..";

import { Instructions, Prepare, TransactionJSON } from "./types";
import * as utils from "./utils";

function createOrderCancellationTransaction(
  account: string,
  orderCancellation: any
): TransactionJSON {
  const txJSON: any = {
    TransactionType: "OfferCancel",
    Account: account,
    OfferSequence: orderCancellation.orderSequence,
  };
  if (orderCancellation.memos != null) {
    txJSON.Memos = orderCancellation.memos.map(utils.convertMemo);
  }
  return txJSON;
}

function prepareOrderCancellation(
  this: Client,
  address: string,
  orderCancellation: object,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    const txJSON = createOrderCancellationTransaction(
      address,
      orderCancellation
    );
    return utils.prepareTransaction(txJSON, this, instructions);
  } catch (e) {
    return Promise.reject(e);
  }
}

export default prepareOrderCancellation;
