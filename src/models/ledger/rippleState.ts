import { IssuedCurrencyAmount } from '../common'

import BaseLedgerEntry from './baseLedgerEntry'

export default interface RippleState extends BaseLedgerEntry {
  LedgerEntryType: 'RippleState'
  Flags: number
  Balance: IssuedCurrencyAmount
  LowLimit: IssuedCurrencyAmount
  HighLimit: IssuedCurrencyAmount
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
  LowNode?: string
  HighNode?: string
  LowQualityIn?: number
  LowQualityOut?: number
  HighQualityIn?: number
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
}
