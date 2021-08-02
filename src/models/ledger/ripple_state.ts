import { Amount } from "../common";

export interface RippleStateLedgerEntry {
  LedgerEntryType: 'RippleState'
  Flags: number
  Balance: Amount
  LowLimit: Amount
  HighLimit: Amount
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
  LowNode?: string
  HighNode?: string
  LowQualityIn?: number
  LowQualityOut?: number
  HighQualityIn?: number
  HighQualityOut?: number
}