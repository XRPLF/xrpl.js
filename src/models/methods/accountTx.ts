import { LedgerIndex } from "../common";
import { Transaction } from "../transactions";
import Metadata from "../transactions/metadata";

import { BaseRequest, BaseResponse } from "./baseMethod";

export interface AccountTxRequest extends BaseRequest {
  command: "account_tx";
  account: string;
  ledger_index_min?: number;
  ledger_index_max?: number;
  ledger_hash?: string;
  ledger_index?: LedgerIndex;
  binary?: boolean;
  forward?: boolean;
  limit?: number;
  marker?: unknown;
}

interface AccountTransaction {
  ledger_index: number;
  meta: string | Metadata;
  tx?: Transaction;
  tx_blob?: string;
  validated: boolean;
}

export interface AccountTxResponse extends BaseResponse {
  result: {
    account: string;
    ledger_index_min: number;
    ledger_index_max: number;
    limit: number;
    marker?: unknown;
    transactions: AccountTransaction[];
    validated?: boolean;
  };
}
