import { BaseRequest, BaseResponse } from './baseMethod'

export interface FeeRequest extends BaseRequest {
  command: 'fee'
}

export interface FeeResponse extends BaseResponse {
  result: {
    current_ledger_size: string
    current_queue_size: string
    drops: {
      base_fee: string
      median_fee: string
      minimum_fee: string
      open_ledger_fee: string
    }
    expected_ledger_size: string
    ledger_current_index: number
    levels: {
      median_level: string
      minimum_level: string
      open_ledger_level: string
      reference_level: string
    }
    max_queue_size: string
  }
}
