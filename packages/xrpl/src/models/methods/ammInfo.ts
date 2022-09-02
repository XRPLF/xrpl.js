import { Amount, IssuedCurrencyAmount } from '../common'

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
   * A hash that uniquely identifies the AMM instance.
   */
  amm_id?: string

  /**
   * Specifies one of the pool assets (XRP or token) of the AMM instance.
   * Both asset1 and asset2 must be defined to specify an AMM instance.
   */
  asset1?: Amount

  /**
   * Specifies the other pool asset of the AMM instance.
   * Both asset1 and asset2 must be defined to specify an AMM instance.
   */
  asset2?: Amount
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
    Asset1: Amount

    /**
     * Specifies the other pool asset of the AMM instance.
     */
    Asset2: Amount

    /**
     * Represents the liquidity providers' shares of the AMM instance's pools.
     * LPTokens are tokens on XRPL. Each LPToken represents a proportional share of each pool of the AMM instance.
     * The AMM instance account issues the LPTokens to LPs upon liquidity provision.
     * LPTokens are balanced in the LPs trustline upon liquidity removal.
     */
    LPToken: IssuedCurrencyAmount

    /**
     * Specifies the fee, in basis point, to be charged to the traders for the trades
     * executed against the AMM instance. Trading fee is a percentage of the trading volume.
     * Valid values for this field are between 0 and 65000 inclusive.
     * A value of 1 is equivalent to 1/10 bps or 0.001%, allowing trading fee
     * between 0% and 65%. This field is required.
     */
    TradingFee: number

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
