import { APIVersion, DEFAULT_API_VERSION, RIPPLED_API_V1 } from '../common'
import { AccountRoot, SignerList } from '../ledger'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The `account_info` command retrieves information about an account, its
 * activity, and its XRP balance. All information retrieved is relative to a
 * particular version of the ledger. Returns an {@link AccountInfoResponse}.
 *
 * @category Requests
 */
export interface AccountInfoRequest extends BaseRequest, LookupByLedgerRequest {
  command: 'account_info'
  /** A unique identifier for the account, most commonly the account's address. */
  account: string
  /**
   * Whether to get info about this account's queued transactions. Can only be
   * used when querying for the data from the current open ledger. Not available
   * from servers in Reporting Mode.
   */
  queue?: boolean
  /**
   * Request SignerList objects associated with this account.
   */
  signer_lists?: boolean
  /**
   * If true, then the account field only accepts a public key or XRP Ledger
   * address. Otherwise, account can be a secret or passphrase (not
   * recommended). The default is false.
   */
  strict?: boolean
}

export interface AccountQueueTransaction {
  /**
   * Whether this transaction changes this address's ways of authorizing
   * transactions.
   */
  auth_change: boolean
  /** The Transaction Cost of this transaction, in drops of XRP. */
  fee: string
  /**
   * The transaction cost of this transaction, relative to the minimum cost for
   * this type of transaction, in fee levels.
   */
  fee_level: string
  /** The maximum amount of XRP, in drops, this transaction could send or destroy. */
  max_spend_drops: string
  /** The Sequence Number of this transaction. */
  seq: number
}

export interface AccountQueueData {
  /** Number of queued transactions from this address. */
  txn_count: number
  /**
   * Whether a transaction in the queue changes this address's ways of
   * authorizing transactions. If true, this address can queue no further
   * transactions until that transaction has been executed or dropped from the
   * queue.
   */
  auth_change_queued?: boolean
  /** The lowest Sequence Number among transactions queued by this address. */
  lowest_sequence?: number
  /** The highest Sequence Number among transactions queued by this address. */
  highest_sequence?: number
  /**
   * Integer amount of drops of XRP that could be debited from this address if
   * every transaction in the queue consumes the maximum amount of XRP possible.
   */
  max_spend_drops_total?: string
  /** Information about each queued transaction from this address. */
  transactions?: AccountQueueTransaction[]
}

export interface AccountInfoAccountFlags {
  /**
   * Enable rippling on this address's trust lines by default. Required for issuing addresses; discouraged for others.
   */
  defaultRipple: boolean
  /**
   * This account can only receive funds from transactions it sends, and from preauthorized accounts.
   * (It has DepositAuth enabled.)
   */
  depositAuth: boolean
  /**
   * Disallows use of the master key to sign transactions for this account.
   */
  disableMasterKey: boolean
  /**
   * Disallow incoming Checks from other accounts.
   */
  disallowIncomingCheck?: boolean
  /**
   * Disallow incoming NFTOffers from other accounts. Part of the DisallowIncoming amendment.
   */
  disallowIncomingNFTokenOffer?: boolean
  /**
   * Disallow incoming PayChannels from other accounts. Part of the DisallowIncoming amendment.
   */
  disallowIncomingPayChan?: boolean
  /**
   * Disallow incoming Trustlines from other accounts. Part of the DisallowIncoming amendment.
   */
  disallowIncomingTrustline?: boolean
  /**
   * Client applications should not send XRP to this account. Not enforced by rippled.
   */
  disallowIncomingXRP: boolean
  /**
   * All assets issued by this address are frozen.
   */
  globalFreeze: boolean
  /**
   * This address cannot freeze trust lines connected to it. Once enabled, cannot be disabled.
   */
  noFreeze: boolean
  /**
   * The account has used its free SetRegularKey transaction.
   */
  passwordSpent: boolean
  /**
   * This account must individually approve other users for those users to hold this account's issued currencies.
   */
  requireAuthorization: boolean
  /**
   * Requires incoming payments to specify a Destination Tag.
   */
  requireDestinationTag: boolean
  /**
   * This address can claw back issued IOUs. Once enabled, cannot be disabled.
   */
  allowTrustLineClawback: boolean
}

interface BaseAccountInfoResponse extends BaseResponse {
  result: {
    /**
     * The AccountRoot ledger object with this account's information, as stored
     * in the ledger.
     */
    account_data: AccountRoot
    /**
     * A map of account flags parsed out.  This will only be available for rippled nodes 1.11.0 and higher.
     */
    account_flags?: AccountInfoAccountFlags
    /**
     * The ledger index of the current in-progress ledger, which was used when
     * retrieving this information.
     */
    ledger_current_index?: number
    /**
     * The ledger index of the ledger version used when retrieving this
     * information. The information does not contain any changes from ledger
     * versions newer than this one.
     */
    ledger_index?: number
    /**
     * Information about queued transactions sent by this account. This
     * information describes the state of the local rippled server, which may be
     * different from other servers in the peer-to-peer XRP Ledger network. Some
     * fields may be omitted because the values are calculated "lazily" by the
     * queuing mechanism.
     */
    queue_data?: AccountQueueData
    /**
     * True if this data is from a validated ledger version; if omitted or set
     * to false, this data is not final.
     */
    validated?: boolean
  }
}

/**
 * Response expected from a {@link AccountInfoRequest}.
 *
 * @category Responses
 */
export interface AccountInfoResponse extends BaseAccountInfoResponse {
  result: BaseAccountInfoResponse['result'] & {
    /**
     * If requested, array of SignerList ledger objects associated with this account for Multi-Signing.
     * Since an account can own at most one SignerList, this array must have exactly one
     * member if it is present.
     */
    signer_lists?: SignerList[]
  }
}

/**
 * Response expected from a {@link AccountInfoRequest} using API version 1.
 *
 * @category ResponsesV1
 */
export interface AccountInfoV1Response extends BaseAccountInfoResponse {
  result: BaseAccountInfoResponse['result'] & {
    /**
     * The AccountRoot ledger object with this account's information, as stored
     * in the ledger.
     * If requested, also includes Array of SignerList ledger objects
     * associated with this account for Multi-Signing. Since an account can own
     * at most one SignerList, this array must have exactly one member if it is
     * present.
     */
    account_data: BaseAccountInfoResponse['result']['account_data'] & {
      /**
       * Array of SignerList ledger objects associated with this account for Multi-Signing.
       * Since an account can own at most one SignerList, this array must have exactly one
       * member if it is present.
       * Quirk: In API version 1, this field is nested under account_data. For this method,
       * Clio implements the API version 2 behavior where is field is not nested under account_data.
       */
      signer_lists?: SignerList[]
    }
  }
}

/**
 * Type to map between the API version and the response type.
 *
 * @category Responses
 */
export type AccountInfoVersionResponseMap<
  Version extends APIVersion = typeof DEFAULT_API_VERSION,
> = Version extends typeof RIPPLED_API_V1
  ? AccountInfoV1Response
  : AccountInfoResponse
