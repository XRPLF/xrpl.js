import { Amount, Path } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

interface BasePathFindRequest extends BaseRequest {
  command: 'path_find'
  subcommand: string
}

/** Start sending pathfinding information. */
export interface PathFindCreateRequest extends BasePathFindRequest {
  subcommand: 'create'
  /**
   * Unique address of the account to find a path from. In other words, the.
   * Account that would be sending a payment.
   */
  source_account: string
  /** Unique address of the account to find a path to. */
  destination_account: string
  /**
   * Currency Amount that the destination account would receive in a
   * transaction.
   */
  destination_amount: Amount
  /** Currency amount that would be spent in the transaction. */
  send_max?: Amount
  /**
   * Array of arrays of objects, representing payment paths to check. You can
   * use this to keep updated on changes to particular paths you already know
   * about, or to check the overall cost to make a payment along a certain path.
   */
  paths?: Path[]
}

/** Stop sending pathfinding information. */
export interface PathFindCloseRequest extends BasePathFindRequest {
  subcommand: 'close'
}

/** Get the information of the currently-open pathfinding request. */
export interface PathFindStatusRequest extends BasePathFindRequest {
  subcommand: 'status'
}

/**
 * The `path_find` method searches for a path along which a transaction can
 * possibly be made, and periodically sends updates when the path changes over
 * time. For a simpler version that is supported by JSON-RPC, see the
 * `ripple_path_find` method.
 *
 * @category Requests
 */
export type PathFindRequest =
  | PathFindCreateRequest
  | PathFindCloseRequest
  | PathFindStatusRequest

export interface PathFindPathOption {
  /** Array of arrays of objects defining payment paths. */
  paths_computed: Path[]
  /**
   * Currency Amount that the source would have to send along this path for the.
   * Destination to receive the desired amount.
   */
  source_amount: Amount
  /**
   * Destination Amount that the destination would receive along this path.
   * If the `send_max` field is set, this field will be set.
   */
  destination_amount?: Amount
}

/**
 * Response expected from a {@link PathFindRequest}.
 *
 * @category Responses
 */
export interface PathFindResponse extends BaseResponse {
  result: {
    /**
     * Array of objects with suggested paths to take, as described below. If
     * empty, then no paths were found connecting the source and destination
     * accounts.
     */
    alternatives: PathFindPathOption[]
    /** Unique address of the account that would receive a transaction. */
    destination_account: string
    /** Currency amount provided in the WebSocket request. */
    destination_amount: Amount
    /** Unique address that would send a transaction. */
    source_account: string
    /**
     * If false, this is the result of an incomplete search. A later reply
     * may have a better path. If true, then this is the best path found. (It is
     * still theoretically possible that a better path could exist, but rippled
     * won't find it.) Until you close the pathfinding request, rippled.
     * Continues to send updates each time a new ledger closes.
     */
    full_reply: boolean
    /**
     * The ID provided in the WebSocket request is included again at this
     * level.
     */
    id?: number | string
    /**
     * The value true indicates this reply is in response to a path_find close
     * command.
     */
    closed?: true
    /**
     * The value true indicates this reply is in response to a `path_find`
     * status command.
     */
    status?: true
  }
}
