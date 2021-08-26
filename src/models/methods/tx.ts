import { TransactionMetadata } from "../common/transaction";

import { BaseRequest, BaseResponse } from "./baseMethod";

export interface TxRequest extends BaseRequest {
  command: "tx";
  transaction: string;
  binary?: boolean;
  min_ledger?: number;
  max_ledger?: number;
}

export interface TxResponse extends BaseResponse {
  result: {
    hash: string;
    ledger_index: number;
    meta: TransactionMetadata | string;
    validated?: boolean;
  }; // TODO: needs to be `& Transaction` once that type is available
  searched_all?: boolean;
}
