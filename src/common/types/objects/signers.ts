export interface SignerList {
  LedgerEntryType: string,
  OwnerNode: string,
  SignerQuorum: number,
  SignerEntries: SignerEntry[],
  SignerListID: number,
  PreviousTxnID: string,
  PreviousTxnLgrSeq: number
}

export interface SignerEntry {
  Account: string,
  SignerWeight: number
}
