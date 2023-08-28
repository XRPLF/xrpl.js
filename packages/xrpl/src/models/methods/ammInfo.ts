import { Amount, Currency, IssuedCurrencyAmount } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `amm_info` method gets information about an Automated Market Maker (AMM) instance.
 * Returns an {@link AMMInfoResponse}.
 *
 * @category Requests
 */
export interface AMMInfoRequest extends BaseRequest {
  command: 'amm_info'

  /**
   * One of the assets of the AMM pool to look up.
   */
  asset: Currency

  /**
   * The other asset of the AMM pool.
   */
  asset2: Currency
}

/**
 * Response expected from an {@link AMMInfoRequest}.
 *
 * @category Responses
 */
export interface AMMInfoResponse extends BaseResponse {
  result: {
    amm: {
      /**
       * The address of the AMM Account.
       */
      account: string

      /**
       * The total amount of one asset in the AMM's pool.
       * (Note: This could be asset or asset2 from the request)
       */
      amount: Amount

      /**
       * The total amount of the other asset in the AMM's pool.
       * (Note: This could be asset or asset2 from the request)
       */
      amount2: Amount

      /**
       * (Omitted for XRP) If true, the amount currency is currently frozen for asset.
       */
      asset_frozen?: boolean

      /**
       * (Omitted for XRP) If true, the amount currency is currently frozen for asset2.
       */
      asset2_frozen?: boolean

      /**
       * (May be omitted) An Auction Slot Object describing the current auction slot holder, if there is one.
       */
      auction_slot?: {
        /**
         * The address of the account that owns the auction slot.
         */
        account: string

        /**
         * A list of additional accounts that the auction slot holder has designated as being eligible
         * of the discounted trading fee.
         * Each member of this array is an object with one field, account, containing the address of the designated account.
         */
        auth_accounts: Array<{
          account: string
        }>

        /**
         * The discounted trading fee that applies to the auction slot holder, and any eligible accounts
         * when trading against this AMM.
         * This is always 0.
         */
        discounted_fee: number

        /**
         * The ISO 8601 UTC timestamp after which this auction slot expires.
         * After expired, the auction slot does not apply (but the data can remain in the ledger
         * until another transaction replaces it or cleans it up).
         */
        expiration: string

        /**
         * The amount, in LP Tokens, that the auction slot holder paid to win the auction slot.
         * This affects the price to outbid the current slot holder.
         */
        price: Amount

        /**
         * The current 72-minute time interval this auction slot is in, from 0 to 19.
         * The auction slot expires after 24 hours (20 intervals of 72 minutes)
         * and affects the cost to outbid the current holder and how much the current holder is refunded if someone outbids them.
         */
        time_interval: number
      }

      /**
       * The total amount of this AMM's LP Tokens outstanding.
       */
      lp_token: IssuedCurrencyAmount

      /**
       * The AMM's current trading fee, in units of 1/100,000; a value of 1 is equivalent to a 0.001% fee.
       */
      trading_fee: number

      /**
       * (May be omitted) The current votes for the AMM's trading fee, as Vote Slot Objects.
       */
      vote_slots?: Array<{
        account: string
        trading_fee: number
        vote_weight: number
      }>
    }

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
     * If included and set to true, the information in this response comes from
     * a validated ledger version. Otherwise, the information is subject to
     * change.
     */
    validated?: boolean
  }
}
