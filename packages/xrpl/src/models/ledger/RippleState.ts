import { IssuedCurrencyAmount } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The RippleState object type connects two accounts in a single currency.
 *
 * @category Ledger Entries
 */
export default interface RippleState extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'RippleState'
  /** A bit-map of boolean options enabled for this object. */
  Flags: number
  /**
   * The balance of the trust line, from the perspective of the low account. A
   * negative balance indicates that the low account has issued currency to the
   * high account. The issuer is always the neutral value ACCOUNT_ONE.
   */
  Balance: IssuedCurrencyAmount
  /**
   * The limit that the low account has set on the trust line. The issuer is
   * the address of the low account that set this limit.
   */
  LowLimit: IssuedCurrencyAmount
  /**
   * The limit that the high account has set on the trust line. The issuer is
   * the address of the high account that set this limit.
   */
  HighLimit: IssuedCurrencyAmount
  /**
   * A hint indicating which page of the low account's owner directory links to
   * this object, in case the directory consists of multiple pages.
   */
  LowNode?: string
  /**
   * A hint indicating which page of the high account's owner directory links
   * to this object, in case the directory consists of multiple pages.
   */
  HighNode?: string
  /**
   * The inbound quality set by the low account, as an integer in the implied
   * ratio LowQualityIn:1,000,000,000. As a special case, the value 0 is
   * equivalent to 1 billion, or face value.
   */
  LowQualityIn?: number
  /**
   * The outbound quality set by the low account, as an integer in the implied
   * ratio LowQualityOut:1,000,000,000. As a special case, the value 0 is
   * equivalent to 1 billion, or face value.
   */
  LowQualityOut?: number
  /**
   * The inbound quality set by the high account, as an integer in the implied
   * ratio HighQualityIn:1,000,000,000. As a special case, the value 0 is
   * equivalent to 1 billion, or face value.
   */
  HighQualityIn?: number
  /**
   * The outbound quality set by the high account, as an integer in the implied
   * ratio HighQualityOut:1,000,000,000. As a special case, the value 0 is
   * equivalent to 1 billion, or face value.
   */
  HighQualityOut?: number
}

export enum RippleStateFlags {
  // True, if entry counts toward reserve.
  lsfLowReserve = 0x00010000,
  lsfHighReserve = 0x00020000,
  lsfLowAuth = 0x00040000,
  lsfHighAuth = 0x00080000,
  lsfLowNoRipple = 0x00100000,
  lsfHighNoRipple = 0x00200000,
  // True, low side has set freeze flag
  lsfLowFreeze = 0x00400000,
  // True, high side has set freeze flag
  lsfHighFreeze = 0x00800000,
  // True, trust line to AMM. Used by client apps to identify payments via AMM.
  lsfAMMNode = 0x01000000,
}
