import { BaseRequest, BaseResponse } from './baseMethod'
import { JobType, ServerState, StateAccounting } from './serverInfo'

/**
 * The `server_state` command asks the server for various machine-readable
 * information about the rippled server's current state. The response is almost
 * the same as the server_info method, but uses units that are easier to process
 * instead of easier to read.
 *
 * @category Requests
 */
export interface ServerStateRequest extends BaseRequest {
  command: 'server_state'
}

/**
 * Response expected from a {@link ServerStateRequest}.
 *
 * @category Responses
 */
export interface ServerStateResponse extends BaseResponse {
  result: {
    state: {
      amendment_blocked?: boolean
      build_version: string
      complete_ledgers: string
      closed_ledger?: {
        age: number
        base_fee: number
        hash: string
        reserve_base: number
        reserve_inc: number
        seq: number
      }
      io_latency_ms: number
      jq_trans_overflow: string
      last_close: {
        converge_time_s: number
        proposers: number
      }
      load?: {
        job_types: JobType[]
        threads: number
      }
      load_base: number
      load_factor: number
      load_factor_fee_escalation?: number
      load_factor_fee_queue?: number
      load_factor_fee_reference?: number
      load_factor_server?: number
      peers: number
      pubkey_node: string
      pubkey_validator?: string
      server_state: ServerState
      server_state_duration_us: number
      state_accounting: Record<ServerState, StateAccounting>
      time: string
      uptime: number
      validated_ledger?: {
        age: number
        base_fee: number
        hash: string
        reserve_base: number
        reserve_inc: number
        seq: number
      }
      validation_quorum: number
      validator_list_expires?: string
    }
  }
}
