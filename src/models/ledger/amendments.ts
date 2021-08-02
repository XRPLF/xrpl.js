interface Majority {
  Majority: {
    Amendment: string
    CloseTime: number
  }
}

export interface Amendments {
  LedgerEntryType: 'Amendments'
  Amendments?: string[]
  Majorities?: Majority[]
  Flags: 0
}