import { BaseRequest, BaseResponse } from "./baseMethod";

export interface LedgerCurrentRequest extends BaseRequest {
  command: "ledger_current";
}

export interface LedgerCurrentResponse extends BaseResponse {
  result: {
    ledger_current_index: number;
  };
}
