interface SignerEntry {
  SignerEntry: {
    Account: string
    SignerWeight: number
  }
}

export interface SignerList {
  LedgerEntryType: 'SignerList'
  Flags: number
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
  OwnerNode: string
  SignerEntries: SignerEntry[]
  SignerListID: number
  SignerQuorum: number
}