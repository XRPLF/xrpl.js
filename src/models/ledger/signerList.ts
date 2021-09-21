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

export enum SignerListLedgerFlags {
  lsfOneOwnerCount = 0x00010000, // True, uses only one OwnerCount
}
