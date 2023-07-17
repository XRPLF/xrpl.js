import { Amount, Currency, IssuedCurrencyAmount } from '../common'

import { BaseRequest, BaseResponse } from './baseMethod'

/**
 * The `amm_info` command retrieves information about an AMM instance.
 * Returns an {@link AMMInfoResponse}.
 *
 * @category Requests
 */
export interface AMMInfoRequest extends BaseRequest {
  command: 'amm_info'

  /**
   * Specifies one of the pool assets (XRP or token) of the AMM instance.
   * Both asset and asset2 must be defined to specify an AMM instance.
   */
  asset: Currency

  /**
   * Specifies the other pool asset of the AMM instance.
   * Both asset and asset2 must be defined to specify an AMM instance.
   */
  asset2: Currency
}

interface AuthAccount {
  account: string
}

interface VoteSlot {
  account: string
  trading_fee: number
  vote_weight: number
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
       * The account that tracks the balance of LPTokens between the AMM instance via Trustline.
       */
      account: string

      /**
       * One of the pool assets (XRP or token) of the AMM instance.
       */
      amount: Amount

      /**
       * The other pool asset of the AMM instance.
       */
      amount2: Amount

      /**
       * (Omitted for XRP) If true, the amount currency is currently frozen for asset.
       */
      asset_frozen: boolean

      /**
       * (Omitted for XRP) If true, the amount currency is currently frozen for asset2.
       */
      asset2_frozen: boolean

      /**
       * Details of the current owner of the auction slot.
       */
      auction_slot?: {
        /**
         * The current owner of this auction slot.
         */
        account: string

        /**
         * A list of at most 4 additional accounts that are authorized to trade at the discounted fee for this AMM instance.
         */
        auth_accounts: AuthAccount[]

        /**
         * The trading fee to be charged to the auction owner, in the same format as TradingFee.
         * By default this is 0, meaning that the auction owner can trade at no fee instead of the standard fee for this AMM.
         */
        discounted_fee: number

        /**
         * The time when this slot expires, in seconds since the Ripple Epoch.
         */
        expiration: string

        /**
         * The amount the auction owner paid to win this slot, in LPTokens.
         */
        price: Amount

        /**
         * Total slot time of 24-hours is divided into 20 equal time intervals.
         */
        time_interval: number
      }

      /**
       * The total outstanding balance of liquidity provider tokens from this AMM instance.
       * The holders of these tokens can vote on the AMM's trading fee in proportion to their holdings,
       * or redeem the tokens for a share of the AMM's assets which grows with the trading fees collected.
       */
      lp_token: IssuedCurrencyAmount

      /**
       * Specifies the fee, in basis point, to be charged to the traders for the trades
       * executed against the AMM instance. Trading fee is a percentage of the trading volume.
       * Valid values for this field are between 0 and 1000 inclusive.
       * A value of 1 is equivalent to 1/10 bps or 0.001%, allowing trading fee
       * between 0% and 1%. This field is required.
       */
      trading_fee: number

      /**
       * Keeps a track of up to eight active votes for the instance.
       */
      vote_slots?: VoteSlot[]
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
