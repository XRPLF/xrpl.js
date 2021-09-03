import { Client } from "..";
import { xrpToDrops } from "../utils";

import { Instructions, Prepare, TransactionJSON } from "./types";
import * as utils from "./utils";

const ValidationError = utils.common.errors.ValidationError;
const claimFlags = utils.common.txFlags.PaymentChannelClaim;

export interface PaymentChannelClaim {
  channel: string;
  balance?: string;
  amount?: string;
  signature?: string;
  publicKey?: string;
  renew?: boolean;
  close?: boolean;
}

function createPaymentChannelClaimTransaction(
  account: string,
  claim: PaymentChannelClaim
): TransactionJSON {
  const txJSON: TransactionJSON = {
    Account: account,
    TransactionType: "PaymentChannelClaim",
    Channel: claim.channel,
    Flags: 0,
  };

  if (claim.balance != null) {
    txJSON.Balance = xrpToDrops(claim.balance);
  }
  if (claim.amount != null) {
    txJSON.Amount = xrpToDrops(claim.amount);
  }

  if (Boolean(claim.signature) !== Boolean(claim.publicKey)) {
    throw new ValidationError(
      '"signature" and "publicKey" fields on' +
        " PaymentChannelClaim must only be specified together."
    );
  }

  if (claim.signature != null) {
    txJSON.Signature = claim.signature;
  }
  if (claim.publicKey != null) {
    txJSON.PublicKey = claim.publicKey;
  }

  if (claim.renew && claim.close) {
    throw new ValidationError(
      '"renew" and "close" flags on PaymentChannelClaim' +
        " are mutually exclusive"
    );
  }

  txJSON.Flags = 0;
  if (claim.renew) {
    txJSON.Flags |= claimFlags.Renew;
  }
  if (claim.close) {
    txJSON.Flags |= claimFlags.Close;
  }

  return txJSON;
}

async function preparePaymentChannelClaim(
  this: Client,
  address: string,
  paymentChannelClaim: PaymentChannelClaim,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    const txJSON = createPaymentChannelClaimTransaction(
      address,
      paymentChannelClaim
    );
    return await utils.prepareTransaction(txJSON, this, instructions);
  } catch (e) {
    return Promise.reject(e);
  }
}

export default preparePaymentChannelClaim;
