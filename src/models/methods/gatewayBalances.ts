import { LedgerIndex } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The gateway_balances command calculates the total balances issued by a given
 * account, optionally excluding amounts held by operational addresses. Expects
 * a response in the form of a {@link GatewayBalancesResponse}.
 *
 * @example
 * ```ts
 * const gatewayBalances: GatewayBalanceRequest = {
 *   "id": "example_gateway_balances_1",
 *   "command": "gateway_balances",
 *   "account": "rMwjYedjc7qqtKYVLiAccJSmCwih4LnE2q",
 *   "strict": true,
 *   "hotwallet": ["rKm4uWpg9tfwbVSeATv4KxDe6mpE9yPkgJ","ra7JkEzrgeKHdzKgo4EUUVBnxggY4z37kt"],
 *   "ledger_index": "validated"
 * }
 * ```
 *
 * @category Requests
 */
export interface GatewayBalancesRequest extends BaseRequest {
  command: 'gateway_balances'
  /** The Address to check. This should be the issuing address. */
  account: string
  /**
   * If true, only accept an address or public key for the account parameter.
   * Defaults to false.
   */
  strict?: boolean
  /**
   * An operational address to exclude from the balances issued, or an array of
   * Such addresses.
   */
  hotwallet?: string | string[]
  /** A 20-byte hex string for the ledger version to use. */
  ledger_hash?: string
  /**
   * The ledger index of the ledger version to use, or a shortcut string to
   * choose a ledger automatically.
   */
  ledger_index?: LedgerIndex
}

interface Balance {
  currency: string
  value: string
}

/**
 * Expected response from a {@link GatewayBalancesRequest}.
 *
 * @category Responses
 */
export interface GatewayBalancesResponse extends BaseResponse {
  result: {
    /** The address of the account that issued the balances. */
    account: string
    /**
     * Total amounts issued to addresses not excluded, as a map of currencies
     * to the total value issued.
     */
    obligations?: { [currency: string]: string }
    /**
     * Amounts issued to the hotwallet addresses from the request. The keys are
     * addresses and the values are arrays of currency amounts they hold.
     */
    balances?: { [address: string]: Balance[] }
    /**
     * Total amounts held that are issued by others. In the recommended
     * configuration, the issuing address should have none.
     */
    assets?: { [address: string]: Balance[] }
    /**
     * The identifying hash of the ledger version that was used to generate
     * this response.
     */
    ledger_hash?: string
    /**
     * The ledger index of the ledger version that was used to generate this
     * response.
     */
    ledger_current_index?: number
    /**
     * The ledger index of the current in-progress ledger version, which was
     * used to retrieve this information.
     */
    ledger_index?: number
  }
}
