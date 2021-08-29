import { BaseRequest, BaseResponse } from "./baseMethod";

export interface SubmitRequest extends BaseRequest {
  command: "submit";
  tx_blob: string;
  fail_hard?: boolean;
}

export interface SubmitResponse extends BaseResponse {
  result: {
    engine_result: string;
    engine_result_code: number;
    engine_result_message: string;
    tx_blob: string;
    tx_json: any; // TODO: type this properly when we have Transaction types
    accepted: boolean;
    account_sequence_available: number;
    account_sequence_next: number;
    applied: boolean;
    broadcast: boolean;
    kept: boolean;
    queued: boolean;
    open_ledger_cost: string;
    validated_ledger_index: number;
  };
}
