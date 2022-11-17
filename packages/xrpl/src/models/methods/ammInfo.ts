import { Amount, Issue, IssuedCurrencyAmount } from '../common'

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
  asset?: Issue

  /**
   * Specifies the other pool asset of the AMM instance.
   * Both asset and asset2 must be defined to specify an AMM instance.
   */
  asset2?: Issue
}

interface AuthAccount {
  AuthAccount: {
    Account: string
  }
}

interface VoteEntry {
  VoteEntry: {
    Account: string
    TradingFee: number
    VoteWeight: number
  }
}

/**
 * Response expected from an {@link AMMInfoRequest}.
 *
 * @category Responses
 */
export interface AMMInfoResponse extends BaseResponse {
  result: {
    /**
     * The account that tracks the balance of LPTokens between the AMM instance via Trustline.
     */
    AMMAccount: string

    /**
     * Specifies one of the pool assets (XRP or token) of the AMM instance.
     */
    Asset: Issue

    /**
     * Specifies the other pool asset of the AMM instance.
     */
    Asset2: Issue

    /**
     * Details of the current owner of the auction slot.
     */
    AuctionSlot?: {
      /**
       * The current owner of this auction slot.
       */
      Account: string

      /**
       * A list of at most 4 additional accounts that are authorized to trade at the discounted fee for this AMM instance.
       */
      AuthAccounts: AuthAccount[]

      /**
       * The trading fee to be charged to the auction owner, in the same format as TradingFee.
       * By default this is 0, meaning that the auction owner can trade at no fee instead of the standard fee for this AMM.
       */
      DiscountedFee: number

      /**
       * The time when this slot expires, in seconds since the Ripple Epoch.
       */
      Expiration: string

      /**
       * The amount the auction owner paid to win this slot, in LPTokens.
       */
      Price: Amount
    }

    /**
     * 	The total outstanding balance of liquidity provider tokens from this AMM instance.
     * The holders of these tokens can vote on the AMM's trading fee in proportion to their holdings,
     * or redeem the tokens for a share of the AMM's assets which grows with the trading fees collected.
     */
    LPTokenBalance: IssuedCurrencyAmount

    /**
     * Specifies the fee, in basis point, to be charged to the traders for the trades
     * executed against the AMM instance. Trading fee is a percentage of the trading volume.
     * Valid values for this field are between 0 and 1000 inclusive.
     * A value of 1 is equivalent to 1/10 bps or 0.001%, allowing trading fee
     * between 0% and 1%. This field is required.
     */
    TradingFee: number

    /**
     * Keeps a track of up to eight active votes for the instance.
     */
    VoteSlots?: VoteEntry[]

    /**
     * The ledger index of the current in-progress ledger, which was used when
     * retrieving this information.
     */
    ledger_current_index?: number

    /**
     * True if this data is from a validated ledger version; if omitted or set
     * to false, this data is not final.
     */
    validated?: boolean
  }
}
