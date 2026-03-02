import { BaseRequest, BaseResponse, LookupByLedgerRequest } from './baseMethod'

/**
 * The `account_currencies` command retrieves a list of currencies that an
 * account can send or receive, based on its trust lines. Expects an
 * {@link AccountCurrenciesResponse}.
 *
 * @category Requests
 */
export interface AccountCurrenciesRequest
  extends BaseRequest,
    LookupByLedgerRequest {
  command: 'account_currencies'
  /** A unique identifier for the account, most commonly the account's address. */
  account: string
  /**
   * If true, then the account field only accepts a public key or XRP Ledger
   * address. Otherwise, account can be a secret or passphrase (not
   * recommended). The default is false.
   */
  strict?: boolean
}

/**
 * The expected response from an {@link AccountCurrenciesRequest}.
 *
 * @category Responses
 */
export interface AccountCurrenciesResponse extends BaseResponse {
  result: {
    /**
     * The identifying hash of the ledger version used to retrieve this data,
     * as hex.
     */
    ledger_hash?: string
    /** The ledger index of the ledger version used to retrieve this data. */
    ledger_index: number
    /** Array of Currency Codes for currencies that this account can receive. */
    receive_currencies: string[]
    /** Array of Currency Codes for currencies that this account can send. */
    send_currencies: string[]
    /** If true, this data comes from a validated ledger. */
    validated: boolean
  }
}
