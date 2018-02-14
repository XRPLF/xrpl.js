export interface AccountRoot {
  LedgerEntryType: string,
  Account: string,
  Flags: number,
  Sequence: number,
  Balance: string,
  OwnerCount: number,
  PreviousTxnID: string,
  PreviousTxnLgrSeq: number,
  AccountTxnID?: string,
  RegularKey?: string,
  EmailHash?: string,
  MessageKey?: string
  TickSize?: number,
  TransferRate?: number,
  Domain?: string
}
