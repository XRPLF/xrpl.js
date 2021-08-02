export interface LedgerHashes {
    LedgerEntryType: 'LedgerHashes'
    LastLedgerSequence?: number
    Hashes: string[]
    Flags: number
  }