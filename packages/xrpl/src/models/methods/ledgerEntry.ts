import { Currency, XChainBridge } from '../common'
import { LedgerEntry } from '../ledger'

import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The `ledger_entry` method returns a single ledger object from the XRP Ledger
 * in its raw format. Expects a response in the form of a {@link
 * LedgerEntryResponse}.
 *
 * @example
 * ```ts
 * const ledgerEntry: LedgerEntryRequest = {
 *   command: "ledger_entry",
 *   ledger_index: 60102302,
 *   index: "7DB0788C020F02780A673DC74757F23823FA3014C1866E72CC4CD8B226CD6EF4"
 * }
 * ```
 *
 * @category Requests
 */
export interface LedgerEntryRequest extends BaseRequest, LookupByLedgerRequest {
  command: 'ledger_entry'

  /**
   * Retrieve a MPTokenIssuance object from the ledger.
   */
  mpt_issuance?: string

  /**
   * Retrieve a MPToken object from the ledger.
   */
  mptoken?:
    | {
        mpt_issuance_id: string
        account: string
      }
    | string

  /**
   * Retrieve an Automated Market Maker (AMM) object from the ledger.
   * This is similar to amm_info method, but the ledger_entry version returns only the ledger entry as stored.
   */
  amm?: {
    asset: {
      currency: string
      issuer?: string
    }
    asset2: {
      currency: string
      issuer?: string
    }
  }
  /**
   * (Optional) If set to true and the queried object has been deleted,
   * return its complete data prior to its deletion.
   * If set to false or not provided and the queried object has been deleted,
   * return objectNotFound (current behavior).
   * This parameter is supported only by Clio servers
   */
  include_deleted?: boolean
  /**
   * If true, return the requested ledger object's contents as a hex string in
   * the XRP Ledger's binary format. Otherwise, return data in JSON format. The
   * default is false.
   */
  binary?: boolean

  /*
   * Only one of the following properties should be defined in a single request
   * https://xrpl.org/ledger_entry.html.
   *
   * Retrieve any type of ledger object by its unique ID.
   */
  index?: string

  /**
   * Retrieve an AccountRoot object by its address. This is roughly equivalent
   * to the an {@link AccountInfoRequest}.
   */
  account_root?: string

  /** The object ID of a Check object to retrieve. */
  check?: string

  /* Specify the Credential to retrieve. If a string, must be the ledger entry ID of
   * the entry, as hexadecimal. If an object, requires subject, issuer, and
   * credential_type sub-fields.
   */
  credential?:
    | {
        /** The account that is the subject of the credential. */
        subject: string

        /** The account that issued the credential. */
        issuer: string

        /** The type of the credential, as issued. */
        credentialType: string
      }
    | string

  /**
   * Specify a DepositPreauth object to retrieve. If a string, must be the
   * object ID of the DepositPreauth object, as hexadecimal. If an object,
   * requires owner and authorized sub-fields.
   */
  deposit_preauth?:
    | {
        /** The account that provided the preauthorization. */
        owner: string
        /** The account that received the preauthorization. */
        authorized: string
      }
    | string

  /**
   * Specify a DID object to retrieve. If a string, must be the
   * object ID of the DID object, as hexadecimal, or the account ID.
   */
  did?: string

  /**
   * The DirectoryNode to retrieve. If a string, must be the object ID of the
   * directory, as hexadecimal. If an object, requires either `dir_root` o
   * Owner as a sub-field, plus optionally a `sub_index` sub-field.
   */
  directory?:
    | {
        /** If provided, jumps to a later "page" of the DirectoryNode. */
        sub_index?: number
        /** Unique index identifying the directory to retrieve, as a hex string. */
        dir_root?: string
        /** Unique address of the account associated with this directory. */
        owner?: string
      }
    | string

  /**
   * The Escrow object to retrieve. If a string, must be the object ID of the
   * escrow, as hexadecimal. If an object, requires owner and seq sub-fields.
   */
  escrow?:
    | {
        /** The owner (sender) of the Escrow object. */
        owner: string
        /** Sequence Number of the transaction that created the Escrow object. */
        seq: number
      }
    | string

  /**
   * The Offer object to retrieve. If a string, interpret as the unique object
   * ID to the Offer. If an object, requires the sub-fields `account` and `seq`
   * to uniquely identify the offer.
   */
  offer?:
    | {
        /** The account that placed the offer. */
        account: string
        /** Sequence Number of the transaction that created the Offer object. */
        seq: number
      }
    | string

  /** The object ID of a PayChannel object to retrieve. */
  payment_channel?: string

  /**
   * Object specifying the RippleState (trust line) object to retrieve. The
   * accounts and currency sub-fields are required to uniquely specify the
   * rippleState entry to retrieve.
   */
  ripple_state?: {
    /**
     * 2-length array of account Addresses, defining the two accounts linked by
     * this RippleState object.
     */
    accounts: string[]
    /** Currency Code of the RippleState object to retrieve. */
    currency: string
  }

  /**
   * The Ticket object to retrieve. If a string, must be the object ID of the
   * Ticket, as hexadecimal. If an object, the `owner` and `ticket_sequence`
   * sub-fields are required to uniquely specify the Ticket entry.
   */
  ticket?:
    | {
        /** The owner of the Ticket object. */
        owner: string
        /** The Ticket Sequence number of the Ticket entry to retrieve. */
        ticket_sequence: number
      }
    | string

  /**
   * Must be the object ID of the NFToken page, as hexadecimal
   */
  nft_page?: string

  bridge_account?: string

  bridge?: XChainBridge

  xchain_owned_claim_id?:
    | {
        locking_chain_door: string
        locking_chain_issue: Currency
        issuing_chain_door: string
        issuing_chain_issue: Currency
        xchain_owned_claim_id: string | number
      }
    | string

  xchain_owned_create_account_claim_id?:
    | {
        locking_chain_door: string
        locking_chain_issue: Currency
        issuing_chain_door: string
        issuing_chain_issue: Currency
        xchain_owned_create_account_claim_id: string | number
      }
    | string
}

/**
 * Response expected from a {@link LedgerEntryRequest}.
 *
 * @category Responses
 */
export interface LedgerEntryResponse<T = LedgerEntry> extends BaseResponse {
  result: {
    /** The unique ID of this ledger object. */
    index: string
    /** The ledger index of the ledger that was used when retrieving this data. */
    ledger_current_index: number
    /**
     * Object containing the data of this ledger object, according to the
     * ledger format.
     */
    node?: T
    /** The binary representation of the ledger object, as hexadecimal. */
    node_binary?: string
    validated?: boolean
    /**
     * (Optional) Indicates the ledger index at which the object was deleted.
     */
    deleted_ledger_index?: number
  }
}
