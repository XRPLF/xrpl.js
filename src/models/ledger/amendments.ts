interface Majority {
  Majority: {
    Amendment: string
    CloseTime: number
  }
}

export interface AmendmentsLedgerEntry {
  LedgerEntryType: 'Amendments'
  Amendments?: string[]
  Majorities?: Majority[]
  Flags: 0
}