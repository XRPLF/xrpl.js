import BigNumber from "bignumber.js";

import type { Client } from "..";
import { FormattedTrustlineSpecification } from "../common/types/objects/trustlines";

import { Instructions, Prepare, TransactionJSON } from "./types";
import * as utils from "./utils";

const trustlineFlags = utils.common.txFlags.TrustSet;

function convertQuality(quality) {
  return new BigNumber(quality)
    .shiftedBy(9)
    .integerValue(BigNumber.ROUND_DOWN)
    .toNumber();
}

function createTrustlineTransaction(
  account: string,
  trustline: FormattedTrustlineSpecification
): TransactionJSON {
  const limit = {
    currency: trustline.currency,
    issuer: trustline.counterparty,
    value: trustline.limit,
  };

  const txJSON: any = {
    TransactionType: "TrustSet",
    Account: account,
    LimitAmount: limit,
    Flags: 0,
  };
  if (trustline.qualityIn != null) {
    txJSON.QualityIn = convertQuality(trustline.qualityIn);
  }
  if (trustline.qualityOut != null) {
    txJSON.QualityOut = convertQuality(trustline.qualityOut);
  }
  if (trustline.authorized) {
    txJSON.Flags |= trustlineFlags.SetAuth;
  }
  if (trustline.ripplingDisabled != null) {
    txJSON.Flags |= trustline.ripplingDisabled
      ? trustlineFlags.NoRipple
      : trustlineFlags.ClearNoRipple;
  }
  if (trustline.frozen != null) {
    txJSON.Flags |= trustline.frozen
      ? trustlineFlags.SetFreeze
      : trustlineFlags.ClearFreeze;
  }
  if (trustline.memos != null) {
    txJSON.Memos = trustline.memos.map(utils.convertMemo);
  }
  return txJSON;
}

async function prepareTrustline(
  this: Client,
  address: string,
  trustline: FormattedTrustlineSpecification,
  instructions: Instructions = {}
): Promise<Prepare> {
  try {
    const txJSON = createTrustlineTransaction(address, trustline);
    return await utils.prepareTransaction(txJSON, this, instructions);
  } catch (e) {
    return Promise.reject(e);
  }
}

export default prepareTrustline;
