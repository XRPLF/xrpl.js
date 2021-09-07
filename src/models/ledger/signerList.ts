import BaseLedgerEntry from './baseLedgerEntry'

interface SignerEntry {
  SignerEntry: {
    Account: string
    SignerWeight: number
  }
}

export default interface SignerList extends BaseLedgerEntry {
  LedgerEntryType: 'SignerList'
  Flags: number
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
  OwnerNode: string
  SignerEntries: SignerEntry[]
  SignerListID: number
  SignerQuorum: number
}
