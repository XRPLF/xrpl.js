import type {
  Amount,
  Currency,
  Path,
  StreamType,
  ResponseOnlyTxInfo,
  APIVersion,
  DEFAULT_API_VERSION,
  RIPPLED_API_V1,
  RIPPLED_API_V2,
} from '../common'
import { Offer } from '../ledger'
import { OfferCreate, Transaction } from '../transactions'
import { TransactionMetadata } from '../transactions/metadata'

import type { BaseRequest, BaseResponse } from './baseMethod'
import { ManifestRequest } from './manifest'

export interface SubscribeBook {
  /**
   * Specification of which currency the account taking the Offer would
   * receive, as a currency object with no amount.
   */
  taker_gets: Currency
  /**
   * Specification of which currency the account taking the Offer would pay, as
   * a currency object with no amount.
   */
  taker_pays: Currency
  /**
   * Unique account address to use as a perspective for viewing offers, in the.
   * XRP Ledger's base58 format.
   */
  taker: string
  /**
   * If true, return the current state of the order book once when you
   * subscribe before sending updates. The default is false.
   */
  snapshot?: boolean
  /** If true, return both sides of the order book. The default is false. */
  both?: boolean
  /**
   * The object ID of a PermissionedDomain object. If this field is included,
   * then the offers will be filtered to only show the valid domain offers for
   * that domain.
   */
  domain?: string
}

/**
 * The subscribe method requests periodic notifications from the server when
 * certain events happen. Expects a response in the form of a
 * {@link SubscribeResponse}.
 *
 * @category Requests
 */
export interface SubscribeRequest extends BaseRequest {
  command: 'subscribe'
  /** Array of string names of generic streams to subscribe to. */
  streams?: StreamType[]
  /**
   * Array with the unique addresses of accounts to monitor for validated
   * transactions. The addresses must be in the XRP Ledger's base58 format.
   * The server sends a notification for any transaction that affects at least
   * one of these accounts.
   */
  accounts?: string[]
  /** Like accounts, but include transactions that are not yet finalized. */
  accounts_proposed?: string[]
  /**
   * Array of objects defining order books  to monitor for updates, as detailed
   * Below.
   */
  books?: SubscribeBook[]
  /**
   * URL where the server sends a JSON-RPC callbacks for each event.
   * Admin-only.
   */
  url?: string
  /** Username to provide for basic authentication at the callback URL. */
  url_username?: string
  /** Password to provide for basic authentication at the callback URL. */
  url_password?: string
}

export type BooksSnapshot = Offer[]

/**
 * Response expected from a {@link SubscribeRequest}.
 *
 * @category Responses
 */
export interface SubscribeResponse extends BaseResponse {
  result: Record<string, never> | LedgerStreamResponse | BooksSnapshot
}

interface BaseStream {
  type: string
}

/**
 * The `ledger` stream only sends `ledgerClosed` messages when the consensus
 * process declares a new validated ledger. The message identifies the ledger
 * And provides some information about its contents.
 *
 * @category Streams
 */
export interface LedgerStream extends BaseStream {
  type: 'ledgerClosed'
  /**
   * The reference transaction cost as of this ledger version, in drops of XRP.
   * If this ledger version includes a SetFee pseudo-transaction the new.
   * Transaction cost applies starting with the following ledger version.
   */
  fee_base: number
  /** The reference transaction cost in "fee units". This is not returned after the SetFees amendment is enabled. */
  fee_ref?: number
  /** The identifying hash of the ledger version that was closed. */
  ledger_hash: string
  /** The ledger index of the ledger that was closed. */
  ledger_index: number
  /** The time this ledger was closed, in seconds since the Ripple Epoch. */
  ledger_time: number
  /**
   * The minimum reserve, in drops of XRP, that is required for an account. If
   * this ledger version includes a SetFee pseudo-transaction the new base reserve
   * applies starting with the following ledger version.
   */
  reserve_base: number
  /**
   * The owner reserve for each object an account owns in the ledger, in drops
   * of XRP. If the ledger includes a SetFee pseudo-transaction the new owner
   * reserve applies after this ledger.
   */
  reserve_inc: number
  /** Number of new transactions included in this ledger version. */
  txn_count: number
  /**
   * Range of ledgers that the server has available. This may be a disjoint
   * sequence such as 24900901-24900984,24901116-24901158. This field is not
   * returned if the server is not connected to the network, or if it is
   * connected but has not yet obtained a ledger from the network.
   */
  validated_ledgers?: string

  /**
   * The network from which the ledger stream is received.
   */
  network_id?: number
}

/**
 * This response mirrors the LedgerStream, except it does NOT include the 'type' nor 'txn_count' fields.
 */
export interface LedgerStreamResponse {
  /**
   * The reference transaction cost as of this ledger version, in drops of XRP.
   * If this ledger version includes a SetFee pseudo-transaction the new.
   * Transaction cost applies starting with the following ledger version.
   */
  fee_base: number
  /** The reference transaction cost in "fee units". This is not returned after the SetFees amendment is enabled. */
  fee_ref?: number
  /** The identifying hash of the ledger version that was closed. */
  ledger_hash: string
  /** The ledger index of the ledger that was closed. */
  ledger_index: number
  /** The time this ledger was closed, in seconds since the Ripple Epoch. */
  ledger_time: number
  /**
   * The minimum reserve, in drops of XRP, that is required for an account. If
   * this ledger version includes a SetFee pseudo-transaction the new base reserve
   * applies starting with the following ledger version.
   */
  reserve_base: number
  /**
   * The owner reserve for each object an account owns in the ledger, in drops
   * of XRP. If the ledger includes a SetFee pseudo-transaction the new owner
   * reserve applies after this ledger.
   */
  reserve_inc: number
  /**
   * Range of ledgers that the server has available. This may be a disjoint
   * sequence such as 24900901-24900984,24901116-24901158. This field is not
   * returned if the server is not connected to the network, or if it is
   * connected but has not yet obtained a ledger from the network.
   */
  validated_ledgers?: string

  /**
   * The network from which the ledger stream is received.
   */
  network_id?: number
}

/**
 * The validations stream sends messages whenever it receives validation
 * messages, also called validation votes, regardless of whether or not the
 * validation message is from a trusted validator.
 *
 * @category Streams
 */
export interface ValidationStream extends BaseStream {
  type: 'validationReceived'
  /**
   * The value validationReceived indicates this is from the validations
   * Stream.
   */
  amendments?: string[]
  /** The amendments this server wants to be added to the protocol. */
  base_fee?: number
  /**
   * An arbitrary value chosen by the server at startup.
   *
   * If the same validation key pair signs validations with different cookies
   * concurrently, that usually indicates that multiple servers are incorrectly
   * configured to use the same validation key pair.
   */
  cookie?: string
  /**
   * The contents of the validation message in its canonical binary form
   */
  data?: string
  /**
   * The unscaled transaction cost (reference_fee value) this server wants to
   * set by Fee voting.
   */
  flags: number
  /**
   * Bit-mask of flags added to this validation message. The flag 0x80000000
   * indicates that the validation signature is fully-canonical. The flag
   * 0x00000001 indicates that this is a full validation; otherwise it's a
   * partial validation. Partial validations are not meant to vote for any
   * particular ledger. A partial validation indicates that the validator is
   * still online but not keeping up with consensus.
   */
  full: boolean
  /**
   * If true, this is a full validation. Otherwise, this is a partial
   * validation. Partial validations are not meant to vote for any particular
   * ledger. A partial validation indicates that the validator is still online
   * but not keeping up with consensus.
   */
  ledger_hash: string
  /** The ledger index of the proposed ledger. */
  ledger_index: string
  /**
   * The local load-scaled transaction cost this validator is currently
   * enforcing, in fee units.
   */
  load_fee?: number
  /**
   * The validator's master public key, if the validator is using a validator
   * token, in the XRP Ledger's base58 format.
   */
  master_key?: string
  /**
   * The minimum reserve requirement (`account_reserve` value) this validator
   * wants to set by fee voting.
   */
  reserve_base?: number
  /**
   * The increment in the reserve requirement (owner_reserve value) this
   * validator wants to set by fee voting.
   */
  reserve_inc?: number
  /** The signature that the validator used to sign its vote for this ledger. */
  signature: string
  /** When this validation vote was signed, in seconds since the Ripple Epoch. */
  signing_time: number
  /**
   * The public key from the key-pair that the validator used to sign the
   * message, in the XRP Ledger's base58 format. This identifies the validator
   * sending the message and can also be used to verify the signature. If the
   * validator is using a token, this is an ephemeral public key.
   */
  validation_public_key: string

  /**
   * The network from which the validations stream is received.
   */
  network_id?: number
}

/**
 * Many subscriptions result in messages about transactions.
 *
 * @category Streams
 */
interface TransactionStreamBase<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
> extends BaseStream {
  status: string
  type: 'transaction'
  /**
   * The approximate time this ledger was closed, in date time string format.
   * Always uses the UTC time zone.
   */
  close_time_iso: Version extends typeof RIPPLED_API_V2 ? string : never
  /** String Transaction result code. */
  engine_result: string
  /** Numeric transaction response code, if applicable. */
  engine_result_code: number
  /** Human-readable explanation for the transaction response. */
  engine_result_message: string
  /**
   * The unique hash identifier of the transaction.
   */
  hash?: Version extends typeof RIPPLED_API_V2 ? string : never
  /**
   * The ledger index of the current in-progress ledger version for which this
   * transaction is currently proposed.
   */
  ledger_current_index?: number
  /** The identifying hash of the ledger version that includes this transaction. */
  ledger_hash?: string
  /** The ledger index of the ledger version that includes this transaction. */
  ledger_index?: number
  /**
   * The transaction metadata, which shows the exact outcome of the transaction
   * in detail.
   */
  meta?: TransactionMetadata
  /** JSON object defining the transaction. */
  tx_json?: Version extends typeof RIPPLED_API_V2
    ? Transaction & ResponseOnlyTxInfo
    : never
  /** JSON object defining the transaction in rippled API v1. */
  transaction?: Version extends typeof RIPPLED_API_V1
    ? Transaction & ResponseOnlyTxInfo
    : never
  /**
   * If true, this transaction is included in a validated ledger and its
   * outcome is final. Responses from the transaction stream should always be
   * validated.
   */
  validated?: boolean
  warnings?: Array<{ id: number; message: string }>
}

/**
 * Expected response from an {@link AccountTxRequest}.
 *
 * @category Streams
 */
export type TransactionStream = TransactionStreamBase

/**
 * Expected response from an {@link AccountTxRequest} with `api_version` set to 1.
 *
 * @category Streams
 */
export type TransactionV1Stream = TransactionStreamBase<typeof RIPPLED_API_V1>

/**
 * The admin-only `peer_status` stream reports a large amount of information on
 * the activities of other rippled servers to which this server is connected, in
 * particular their status in the consensus process.
 *
 * @category Streams
 */
export interface PeerStatusStream extends BaseStream {
  type: 'peerStatusChange'
  /**
   * The type of event that prompted this message. See Peer Status Events for
   * possible values.
   */
  action: 'CLOSING_LEDGER' | 'ACCEPTED_LEDGER' | 'SWITCHED_LEDGER' | 'LOST_SYNC'
  /** The time this event occurred, in seconds since the Ripple Epoch. */
  date: number
  /** The identifying Hash of a ledger version to which this message pertains. */
  ledger_hash?: string
  /** The Ledger Index of a ledger version to which this message pertains. */
  ledger_index?: number
  /** The largest Ledger Index the peer has currently available. */
  ledger_index_max?: number
  /** The smallest Ledger Index the peer has currently available. */
  ledger_index_min?: number
}

/**
 * The format of an order book stream message is the same as that of
 * transaction stream messages, except that OfferCreate transactions also
 * contain the following field.
 */
interface ModifiedOfferCreateTransaction extends OfferCreate {
  /**
   * Numeric amount of the TakerGets currency that the Account sending this
   * OfferCreate transaction has after executing this transaction. This does not
   * check whether the currency amount is frozen.
   */
  owner_funds: string
}

/**
 * When you subscribe to one or more order books with the `books` field, you
 * get back any transactions that affect those order books. Has the same format
 * as a {@link TransactionStream} but the transaction can have a `owner_funds`
 * field.
 *
 * @category Streams
 */
export interface OrderBookStream extends BaseStream {
  status: string
  type: 'transaction'
  engine_result: string
  engine_result_code: number
  engine_result_message: string
  ledger_current_index?: number
  ledger_hash?: string
  ledger_index?: number
  meta: TransactionMetadata
  transaction: (Transaction | ModifiedOfferCreateTransaction) & {
    /**
     * This number measures the number of seconds since the "Ripple Epoch" of January 1, 2000 (00:00 UTC)
     */
    date?: number
    /**
     * Every signed transaction has a unique "hash" that identifies it.
     * The transaction hash can be used to look up its final status, which may serve as a "proof of payment"
     */
    hash?: string
  }
  validated: boolean
}

/**
 * The consensus stream sends consensusPhase messages when the consensus
 * process changes phase. The message contains the new phase of consensus the
 * server is in.
 *
 * @category Streams
 */
export interface ConsensusStream extends BaseStream {
  type: 'consensusPhase'
  /**
   * The new consensus phase the server is in. Possible values are open,
   * establish, and accepted.
   */
  consensus: 'open' | 'establish' | 'accepted'
}

/**
 * The path_find method searches for a path along which a transaction can
 * possibly be made, and periodically sends updates when the path changes over
 * time.
 *
 * @category Streams
 */
export interface PathFindStream extends BaseStream {
  type: 'path_find'
  /** Unique address that would send a transaction. */
  source_account: string
  /** Unique address of the account that would receive a transaction. */
  destination_account: string
  /** Currency Amount that the destination would receive in a transaction. */
  destination_amount: Amount
  /**
   * If false, this is the result of an incomplete search. A later reply may
   * have a better path. If true, then this is the best path found. (It is still
   * theoretically possible that a better path could exist, but rippled won't
   * find it.) Until you close the pathfinding request, rippled continues to
   * send updates each time a new ledger closes.
   */
  full_reply: boolean
  /** The ID provided in the WebSocket request is included again at this level. */
  id: number | string
  /** Currency Amount that would be spent in the transaction.  */
  send_max?: Amount
  /**
   * Array of objects with suggested paths to take. If empty, then no paths
   * were found connecting the source and destination accounts.
   */
  alternatives:
    | []
    | {
        paths_computed: Path[]
        source_amount: Amount
      }
}

/**
 * @category Streams
 */
export type Stream =
  | LedgerStream
  | ValidationStream
  | TransactionStream
  | PathFindStream
  | PeerStatusStream
  | OrderBookStream
  | ConsensusStream

export type EventTypes =
  | 'connected'
  | 'disconnected'
  | 'ledgerClosed'
  | 'validationReceived'
  | 'transaction'
  | 'peerStatusChange'
  | 'consensusPhase'
  | 'manifestReceived'
  | 'path_find'
  | 'error'

export type OnEventToListenerMap<T extends EventTypes> = T extends 'connected'
  ? () => void
  : T extends 'disconnected'
  ? (code: number) => void
  : T extends 'ledgerClosed'
  ? (ledger: LedgerStream) => void
  : T extends 'validationReceived'
  ? (validation: ValidationStream) => void
  : T extends 'transaction'
  ? (transaction: TransactionStream) => void
  : T extends 'peerStatusChange'
  ? (peerStatus: PeerStatusStream) => void
  : T extends 'consensusPhase'
  ? (consensus: ConsensusStream) => void
  : T extends 'manifestReceived'
  ? (manifest: ManifestRequest) => void
  : T extends 'path_find'
  ? (path: PathFindStream) => void
  : T extends 'error'
  ? // eslint-disable-next-line @typescript-eslint/no-explicit-any -- needs to be any for overload
    (...err: any[]) => void
  : (...args: never[]) => void
