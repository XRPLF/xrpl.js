import type { Client } from "..";
import { Memo } from "../common/types/objects";

import { Instructions, Prepare, TransactionJSON } from "./types";
import * as utils from "./utils";

export interface EscrowCancellation {
  owner: string;
  escrowSequence: number;

  // TODO: This ripple-lib memo format should be deprecated in favor of rippled's format.
  // If necessary, expose a public method for converting between the two formats.
  memos?: Memo[];
}

function createEscrowCancellationTransaction(
  account: string,
  payment: EscrowCancellation
): TransactionJSON {
  const txJSON: any = {
    TransactionType: "EscrowCancel",
    Account: account,
    Owner: payment.owner,
    OfferSequence: payment.escrowSequence,
  };
  if (payment.memos != null) {
    txJSON.Memos = payment.memos.map(utils.convertMemo);
  }
  return txJSON;
}

async function prepareEscrowCancellation(
  this: Client,
  address: string,
  escrowCancellation: EscrowCancellation,
  instructions: Instructions = {}
): Promise<Prepare> {
  const txJSON = createEscrowCancellationTransaction(
    address,
    escrowCancellation
  );
  return utils.prepareTransaction(txJSON, this, instructions);
}

export default prepareEscrowCancellation;
