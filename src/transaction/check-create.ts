import { Client } from "..";
import { Amount } from "../common/types/objects";
import { ISOTimeToRippleTime, toRippledAmount } from "../utils";

import { Instructions, Prepare, TransactionJSON } from "./types";
import * as utils from "./utils";

export interface CheckCreateParameters {
  destination: string;
  sendMax: Amount;
  destinationTag?: number;
  expiration?: string;
  invoiceID?: string;
}

function createCheckCreateTransaction(
  account: string,
  check: CheckCreateParameters
): TransactionJSON {
  const txJSON: any = {
    Account: account,
    TransactionType: "CheckCreate",
    Destination: check.destination,
    SendMax: toRippledAmount(check.sendMax),
  };

  if (check.destinationTag != null) {
    txJSON.DestinationTag = check.destinationTag;
  }

  if (check.expiration != null) {
    txJSON.Expiration = ISOTimeToRippleTime(check.expiration);
  }

  if (check.invoiceID != null) {
    txJSON.InvoiceID = check.invoiceID;
  }

  return txJSON;
}

async function prepareCheckCreate(
  this: Client,
  address: string,
  checkCreate: CheckCreateParameters,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    const txJSON = createCheckCreateTransaction(address, checkCreate);
    return await utils.prepareTransaction(txJSON, this, instructions);
  } catch (e) {
    return Promise.reject(e);
  }
}

export default prepareCheckCreate;
