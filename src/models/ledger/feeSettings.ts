import { BaseLedgerEntry } from "./baseLedgerEntry";

export interface FeeSettings extends BaseLedgerEntry {
    LedgerEntryType: 'FeeSettings'
    BaseFee: string
    ReferenceFeeUnits: number
    ReserveBase: number
    ReserveIncrement: number
    Flags: number
  }