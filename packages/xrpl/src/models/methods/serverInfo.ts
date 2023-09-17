import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `server_info` command asks the server for a human-readable version of
 * various information about the rippled server being queried. Expects a
 * response in the form of a {@link ServerInfoResponse}.
 *
 * @category Requests
 */
export interface ServerInfoRequest extends BaseRequest {
  command: 'server_info'
}

export type ServerState =
  | 'disconnected'
  | 'connected'
  | 'syncing'
  | 'tracking'
  | 'full'
  | 'validating'
  | 'proposing'

export interface StateAccounting {
  duration_us: string
  transitions: string
}

export interface JobType {
  job_type: string
  per_second: number
  peak_time?: number
  avg_time?: number
  in_progress?: number
}

export type protocol =
  | 'http'
  | 'https'
  | 'grpc'
  | 'peer'
  | 'ws'
  | 'ws2'
  | 'wss'
  | 'wss2'

export interface ServerPort {
  port: string
  /** The values in protocol are sorted in alphabetical order */
  protocol: protocol[]
}

// The states for validating and proposing do not exist in the field state_accounting
// See https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/misc/NetworkOPs.cpp#L4545
// https://github.com/XRPLF/rippled/blob/develop/src/ripple/app/misc/NetworkOPs.h#L66
export type StateAccountingFinal = Record<
  Exclude<ServerState, 'validating' | 'proposing'>,
  StateAccounting
>

/**
 * Response expected from a {@link ServerInfoRequest}.
 *
 * @category Responses
 */
export interface ServerInfoResponse extends BaseResponse {
  result: {
    info: {
      /**
       * If true, this server is amendment blocked. If the server is not
       * amendment blocked, the response omits this field.
       */
      amendment_blocked?: boolean
      /** The version number of the running rippled version. */
      build_version: string
      /**
       * Information on the most recently closed ledger that has not been
       * validated by consensus. If the most recently validated ledger is
       * available, the response omits this field and includes
       * `validated_ledger` instead. The member fields are the same as the.
       * `validated_ledger` field.
       */
      closed_ledger?: {
        age: number
        base_fee_xrp: number
        hash: string
        reserve_base_xrp: number
        reserve_inc_xrp: number
        seq: number
      }
      /**
       * Range expression indicating the sequence numbers of the ledger
       * versions the local rippled has in its database.
       */
      complete_ledgers: string
      /**
       * On an admin request, returns the hostname of the server running the
       * rippled instance; otherwise, returns a single RFC-1751  word based on
       * the node public key.
       */
      hostid: string
      /**
       * Amount of time spent waiting for I/O operations, in milliseconds. If
       * this number is not very, very low, then the rippled server is probably
       * having serious load issues.
       */
      io_latency_ms: number
      /**
       * The number of times (since starting up) that this server has had over
       * 250 transactions waiting to be processed at once. A large number here
       * may mean that your server is unable to handle the transaction load of
       * the XRP Ledger network.
       */
      jq_trans_overflow: string
      /**
       * Information about the last time the server closed a ledger, including
       * the amount of time it took to reach a consensus and the number of
       * trusted validators participating.
       */
      last_close: {
        /**
         * The amount of time it took to reach a consensus on the most recently
         * validated ledger version, in seconds.
         */
        converge_time_s: number
        /**
         * How many trusted validators the server considered (including itself,
         * if configured as a validator) in the consensus process for the most
         * recently validated ledger version.
         */
        proposers: number
      }
      /**
       * (Admin only) Detailed information about the current load state of the
       * server.
       */
      load?: {
        /**
         * (Admin only) Information about the rate of different types of jobs
         * the server is doing and how much time it spends on each.
         */
        job_types: JobType[]
        /** (Admin only) The number of threads in the server's main job pool. */
        threads: number
      }
      /**
       * The load-scaled open ledger transaction cost the server is currently
       * enforcing, as a multiplier on the base transaction cost. For example,
       * at 1000 load factor and a reference transaction cost of 10 drops of
       * XRP, the load-scaled transaction cost is 10,000 drops (0.01 XRP). The
       * load factor is determined by the highest of the individual server's
       * load factor, the cluster's load factor, the open ledger cost and the
       * overall network's load factor.
       */
      load_factor?: number
      /**
       * The network id of the server.
       */
      network_id?: number
      /**
       * Current multiplier to the transaction cost based on
       * load to this server.
       */
      load_factor_local?: number
      /**
       * Current multiplier to the transaction cost being used by the rest of
       * the network.
       */
      load_factor_net?: number
      /**
       * Current multiplier to the transaction cost based on load to servers
       * in this cluster.
       */
      load_factor_cluster?: number
      /**
       * The current multiplier to the transaction cost that a transaction must
       * pay to get into the open ledger.
       */
      load_factor_fee_escalation?: number
      /**
       * The current multiplier to the transaction cost that a transaction must
       * pay to get into the queue, if the queue is full.
       */
      load_factor_fee_queue?: number
      /**
       * The load factor the server is enforcing, not including the open ledger
       * cost.
       */
      load_factor_server?: number
      /**
       * The number of peer connections which were severed.
       */
      peer_disconnects?: string
      /**
       * The number of peer connections which were severed due to excess resource consumption.
       */
      peer_disconnects_resources?: string
      network_ledger?: 'waiting'
      /** How many other rippled servers this one is currently connected to. */
      peers: number
      /**
       * What Websocket/RPC ports rippled is listening on. This allows crawlers to build a richer topology without needing to
       * port-scan nodes. For non-admin users (including peers), info about admin ports is excluded.
       */
      ports: ServerPort[]
      /**
       * Public key used to verify this server for peer-to-peer communications.
       * This node key pair is automatically generated by the server the first
       * time it starts up. (If deleted, the server can create a new pair of
       * Keys.).
       */
      pubkey_node: string
      /** Public key used by this node to sign ledger validations. */
      pubkey_validator?: string
      /**
       * A string indicating to what extent the server is participating in the
       * network.
       */
      server_state: ServerState
      /**
       * The number of consecutive microseconds the server has been in the
       * current state.
       */
      server_state_duration_us: string
      /**
       * A map of various server states with information about the time the
       * server spends in each. This can be useful for tracking the long-term
       * health of your server's connectivity to the network.
       */
      state_accounting: StateAccountingFinal
      /** The current time in UTC, according to the server's clock. */
      time: string
      /** Number of consecutive seconds that the server has been operational. */
      uptime: number
      /** Information about the most recent fully-validated ledger. */
      validated_ledger?: {
        /** The time since the ledger was closed, in seconds. */
        age: number
        /**
         * Base fee, in XRP. This may be represented in scientific notation.
         * Such as 1e-05 for 0.00005.
         */
        base_fee_xrp: number
        /** Unique hash for the ledger, as hexadecimal. */
        hash: string
        /**
         * Minimum amount of XRP (not drops) necessary for every account to.
         * Keep in reserve .
         */
        reserve_base_xrp: number
        /**
         * Amount of XRP (not drops) added to the account reserve for each
         * object an account owns in the ledger.
         */
        reserve_inc_xrp: number
        /** The ledger index of the latest validated ledger. */
        seq: number
      }
      /**
       * Minimum number of trusted validations required to validate a ledger
       * version. Some circumstances may cause the server to require more
       * validations.
       */
      validation_quorum: number
      /**
       * Either the human readable time, in UTC, when the current validator
       * list will expire, the string unknown if the server has yet to load a
       * published validator list or the string never if the server uses a
       * static validator list.
       */
      validator_list_expires?: string
      validator_list?: {
        count: number
        expiration: 'never' | 'unknown' | string
        status: 'active' | 'expired' | 'unknown'
      }
    }
  }
}
