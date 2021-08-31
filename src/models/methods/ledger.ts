import { LedgerIndex } from "../common";
import { Ledger } from "../ledger";
import { Transaction, TransactionAndMetadata } from "../transactions";
import TransactionMetadata from "../transactions/metadata";

import { BaseRequest, BaseResponse } from "./baseMethod";

export interface LedgerRequest extends BaseRequest {
  command: "ledger";
  ledger_hash?: string;
  ledger_index?: LedgerIndex;
  full?: boolean;
  accounts?: boolean;
  transactions?: boolean;
  expand?: boolean;
  owner_funds?: boolean;
  binary?: boolean;
  queue?: boolean;
}

interface ModifiedMetadata extends TransactionMetadata {
  owner_funds: string;
}

interface ModifiedOfferCreateTransaction {
  transaction: Transaction;
  metadata: ModifiedMetadata;
}

interface LedgerQueueData {
  account: string;
  tx:
    | TransactionAndMetadata
    | ModifiedOfferCreateTransaction
    | { tx_blob: string };
  retries_remaining: number;
  preflight_result: string;
  last_result?: string;
  auth_change?: boolean;
  fee?: string;
  fee_level?: string;
  max_spend_drops?: string;
}

interface BinaryLedger
  extends Omit<Omit<Ledger, "transactions">, "accountState"> {
  accountState?: string[];
  transactions?: string[];
}

export interface LedgerResponse extends BaseResponse {
  result: {
    ledger: Ledger | BinaryLedger;
    ledger_hash: string;
    ledger_index: number;
    queue_data?: Array<LedgerQueueData | string>;
    validated?: boolean;
  };
}
