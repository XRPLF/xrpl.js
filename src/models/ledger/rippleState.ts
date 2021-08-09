import { BaseLedgerEntry } from "./baseLedgerEntry";
import { IssuedCurrencyAmount } from "../common";

export interface RippleState extends BaseLedgerEntry {
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