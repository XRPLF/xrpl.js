import {
  Check,
  DepositPreauth,
  Escrow,
  Offer,
  PayChannel,
  RippleState,
  SignerList,
  Ticket,
} from '../ledger'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

export type AccountObjectType =
  | 'check'
  | 'deposit_preauth'
  | 'escrow'
  | 'nft_offer'
  | 'offer'
  | 'payment_channel'
  | 'signer_list'
  | 'state'
  | 'ticket'

/**
 * The account_objects command returns the raw ledger format for all objects
 * owned by an account. For a higher-level view of an account's trust lines and
 * balances, see the account_lines method instead. Expects a response in the
 * form of an {@link AccountObjectsResponse}.
 *
 * @category Requests
 */
export interface AccountObjectsRequest
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'account_objects'
  /** A unique identifier for the account, most commonly the account's address. */
  account: string
  /**
   * If included, filter results to include only this type of ledger object.
   * The valid types are: Check , DepositPreauth, Escrow, Offer, PayChannel,
   * SignerList, Ticket, and RippleState (trust line).
   */
  type?: AccountObjectType
  /**
   * If true, the response only includes objects that would block this account
   * from being deleted. The default is false.
   */
  deletion_blockers_only?: boolean
  /**
   * The maximum number of objects to include in the results. Must be within
   * the inclusive range 10 to 400 on non-admin connections. The default is 200.
   */
  limit?: number
  /**
   * Value from a previous paginated response. Resume retrieving data where
   * that response left off.
   */
  marker?: unknown
}

/**
 * Account Objects can be a Check, a DepositPreauth, an Escrow, an Offer, a
 * PayChannel, a SignerList, a Ticket, or a RippleState.
 */
export type AccountObject =
  | Check
  | DepositPreauth
  | Escrow
  | Offer
  | PayChannel
  | SignerList
  | RippleState
  | Ticket

/**
 * Response expected from an {@link AccountObjectsRequest}.
 *
 * @category Responses
 */
export interface AccountObjectsResponse extends BaseResponse {
  result: {
    /** Unique Address of the account this request corresponds to. */
    account: string
    /**
     * Array of objects owned by this account. Each object is in its raw
     * ledger format.
     */
    account_objects: AccountObject[]
    /**
     * The identifying hash of the ledger that was used to generate this
     * response.
     */
    ledger_hash?: string
    /**
     * The ledger index of the ledger version that was used to generate this
     * response.
     */
    ledger_index?: number
    /**
     * The ledger index of the current in-progress ledger version, which was
     * used to generate this response.
     */
    ledger_current_index?: number
    /** The limit that was used in this request, if any. */
    limit?: number
    /**
     * Server-defined value indicating the response is paginated. Pass this to
     * the next call to resume where this call left off. Omitted when there are
     * no additional pages after this one.
     */
    marker?: string
    /**
     * If included and set to true, the information in this response comes from
     * a validated ledger version. Otherwise, the information is subject to
     * change.
     */
    validated?: boolean
  }
}
