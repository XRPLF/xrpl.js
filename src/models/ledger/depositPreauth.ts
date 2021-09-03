import BaseLedgerEntry from './baseLedgerEntry'

export default interface DepositPreauth extends BaseLedgerEntry {
  LedgerEntryType: 'DepositPreauth'
  Account: string
  Authorize: string
  Flags: 0
  OwnerNode: string
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
}
