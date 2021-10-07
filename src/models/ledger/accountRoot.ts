import BaseLedgerEntry from './baseLedgerEntry'

export default interface AccountRoot extends BaseLedgerEntry {
  LedgerEntryType: 'AccountRoot'
  Account: string
  Balance: string
  Flags: number
  OwnerCount: number
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
  Sequence: number
  AccountTxnID?: string
  Domain?: string
  EmailHash?: string
  MessageKey?: string
  RegularKey?: string
  TicketCount?: number
  TickSize?: number
  TransferRate?: number
}

export interface AccountRootFlagsInterface {
  lsfPasswordSpent?: boolean
  lsfRequireDestTag?: boolean
  lsfRequireAuth?: boolean
  lsfDisallowXRP?: boolean
  lsfDisableMaster?: boolean
  lsfNoFreeze?: boolean
  lsfGlobalFreeze?: boolean
  lsfDefaultRipple?: boolean
  lsfDepositAuth?: boolean
}

export enum AccountRootFlags {
  lsfPasswordSpent = 0x00010000,
  lsfRequireDestTag = 0x00020000,
  lsfRequireAuth = 0x00040000,
  lsfDisallowXRP = 0x00080000,
  lsfDisableMaster = 0x00100000,
  lsfNoFreeze = 0x00200000,
  lsfGlobalFreeze = 0x00400000,
  lsfDefaultRipple = 0x00800000,
  lsfDepositAuth = 0x01000000,
}
