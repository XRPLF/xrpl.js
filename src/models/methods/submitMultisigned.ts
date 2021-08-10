import { BaseRequest, BaseResponse } from "./baseMethod";

export interface SubmitMultisignedRequest extends BaseRequest {
  command: "submit_multisigned"
  tx_json: any // TODO: type this properly when we have Transaction types
  fail_hard?: boolean
}

export interface SubmitMultisignedResponse extends BaseResponse {
  result: {
    engine_result: string
    engine_result_code: number
    engine_result_message: string
    tx_blob: string
    tx_json: any // TODO: type this properly when we have Transaction types
  }
}
