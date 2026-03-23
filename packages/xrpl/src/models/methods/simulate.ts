import {
  BaseTransaction,
  Transaction,
  TransactionMetadata,
} from '../transactions'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `simulate` method simulates a transaction without submitting it to the network.
 * Returns a {@link SimulateResponse}.
 *
 * @category Requests
 */
export type SimulateRequest = BaseRequest & {
  command: 'simulate'

  binary?: boolean
} & (
    | {
        tx_blob: string
        tx_json?: never
      }
    | {
        tx_json: Transaction
        tx_blob?: never
      }
  )

export type SimulateBinaryRequest = SimulateRequest & {
  binary: true
}

export type SimulateJsonRequest = SimulateRequest & {
  binary?: false
}

/**
 * Response expected from an {@link SimulateRequest}.
 *
 * @category Responses
 */
export type SimulateResponse = SimulateJsonResponse | SimulateBinaryResponse

export interface SimulateBinaryResponse extends BaseResponse {
  result: {
    applied: false

    engine_result: string

    engine_result_code: number

    engine_result_message: string

    tx_blob: string

    meta_blob: string

    /**
     * The ledger index of the ledger version that was used to generate this
     * response.
     */
    ledger_index: number
  }
}

export interface SimulateJsonResponse<T extends BaseTransaction = Transaction>
  extends BaseResponse {
  result: {
    applied: false

    engine_result: string

    engine_result_code: number

    engine_result_message: string

    /**
     * The ledger index of the ledger version that was used to generate this
     * response.
     */
    ledger_index: number

    tx_json: T

    meta?: TransactionMetadata<T>
  }
}
