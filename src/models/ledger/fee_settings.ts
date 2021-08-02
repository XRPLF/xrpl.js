export interface FeeSettings {
    LedgerEntryType: 'FeeSettings'
    BaseFee: string
    ReferenceFeeUnits: number
    ReserveBase: number
    ReserveIncrement: number
    Flags: number
  }