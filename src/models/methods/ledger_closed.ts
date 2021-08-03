import { BaseRequest, BaseResponse } from "./base_method";

export interface LedgerClosedRequest extends BaseRequest {
    command: "ledger_closed"
}

export interface LedgerClosedResponse extends BaseResponse {
    result: {
        ledger_hash: string
        ledger_index: number 
     }
}