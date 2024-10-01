import { AuthAccount, Currency, IssuedCurrencyAmount } from '../common'

import { BaseLedgerEntry, HasOptionalPreviousTxnID } from './BaseLedgerEntry'

export interface VoteSlot {
  VoteEntry: {
    Account: string
    TradingFee: number
    VoteWeight: number
  }
}

/**
 * The AMM object type describes a single Automated Market Maker (AMM) instance.
 *
 * @category Ledger Entries
 */
export default interface AMM extends BaseLedgerEntry, HasOptionalPreviousTxnID {
  LedgerEntryType: 'AMM'
  /**
   * The address of the special account that holds this AMM's assets.
   */
  Account: string
  /**
   * The definition for one of the two assets this AMM holds.
   */
  Asset: Currency
  /**
   * The definition for the other asset this AMM holds.
   */
  Asset2: Currency
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
    AuthAccounts?: AuthAccount[]
    /**
     * The trading fee to be charged to the auction owner, in the same format as TradingFee.
     * By default this is 0, meaning that the auction owner can trade at no fee instead of the standard fee for this AMM.
     */
    DiscountedFee: number
    /**
     * The time when this slot expires, in seconds since the Ripple Epoch.
     */
    Expiration: number
    /**
     * The amount the auction owner paid to win this slot, in LP Tokens.
     */
    Price: IssuedCurrencyAmount
  }
  /**
   * The total outstanding balance of liquidity provider tokens from this AMM instance.
   * The holders of these tokens can vote on the AMM's trading fee in proportion to their holdings,
   * or redeem the tokens for a share of the AMM's assets which grows with the trading fees collected.
   */
  LPTokenBalance: IssuedCurrencyAmount
  /**
   * The percentage fee to be charged for trades against this AMM instance, in units of 1/100,000.
   * The maximum value is 1000, for a 1% fee.
   */
  TradingFee: number
  /**
   * A list of vote objects, representing votes on the pool's trading fee.
   */
  VoteSlots?: VoteSlot[]
  /**
   * A bit-map of boolean flags. No flags are defined for the AMM object
   * type, so this value is always 0.
   */
  Flags: 0
}
