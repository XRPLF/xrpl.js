import { Client } from "..";
import { validate } from "../common";
import { ISOTimeToRippleTime, xrpToDrops } from "../utils";

import { Instructions, Prepare, TransactionJSON } from "./types";
import * as utils from "./utils";

export interface PaymentChannelCreate {
  amount: string;
  destination: string;
  settleDelay: number;
  publicKey: string;
  cancelAfter?: string;
  sourceTag?: number;
  destinationTag?: number;
}

function createPaymentChannelCreateTransaction(
  account: string,
  paymentChannel: PaymentChannelCreate
): TransactionJSON {
  const txJSON: any = {
    Account: account,
    TransactionType: "PaymentChannelCreate",
    Amount: xrpToDrops(paymentChannel.amount),
    Destination: paymentChannel.destination,
    SettleDelay: paymentChannel.settleDelay,
    PublicKey: paymentChannel.publicKey.toUpperCase(),
  };

  if (paymentChannel.cancelAfter != null) {
    txJSON.CancelAfter = ISOTimeToRippleTime(paymentChannel.cancelAfter);
  }
  if (paymentChannel.sourceTag != null) {
    txJSON.SourceTag = paymentChannel.sourceTag;
  }
  if (paymentChannel.destinationTag != null) {
    txJSON.DestinationTag = paymentChannel.destinationTag;
  }

  return txJSON;
}

function preparePaymentChannelCreate(
  this: Client,
  address: string,
  paymentChannelCreate: PaymentChannelCreate,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    validate.preparePaymentChannelCreate({
      address,
      paymentChannelCreate,
      instructions,
    });
    const txJSON = createPaymentChannelCreateTransaction(
      address,
      paymentChannelCreate
    );
    return utils.prepareTransaction(txJSON, this, instructions);
  } catch (e) {
    return Promise.reject(e);
  }
}

export default preparePaymentChannelCreate;
