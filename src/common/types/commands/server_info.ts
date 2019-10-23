export interface ServerInfoRequest {
  id?: number
}

export interface ServerInfoResponse {
  info: {
    amendment_blocked?: boolean,
    build_version: string,
    closed_ledger?: LedgerInfo,
    complete_ledgers: string,
    hostid: string,
    io_latency_ms: number,
    last_close: {
      converge_time_s: number,
      proposers: number
    },
    load?: {
      job_types: {
        job_type: string,
        per_second: number,
        in_progress: number
      }[],
      threads: number
    },
    load_factor: number,
    load_factor_local?: number,
    load_factor_net?: number,
    load_factor_cluster?: number,
    load_factor_fee_escalation?: number,
    load_factor_fee_queue?: number,
    load_factor_server?: number,
    peers: number,
    pubkey_node: string,
    pubkey_validator: string,
    server_state: string,
    state_accounting: any,
    uptime: number,
    validated_ledger?: LedgerInfo,
    validation_quorum: number,
    validator_list_expires: string
  },
}

export interface LedgerInfo {
  age: number,
  base_fee_xrp: number,
  hash: string,
  reserve_base_xrp: number,
  reserve_inc_xrp: number,
  seq: number,
}
