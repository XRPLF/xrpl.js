import {SignerEntry} from './index'

export interface AccountRootLedgerEntry {
  LedgerEntryType: 'AccountRoot',
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

export interface AmendmentsLedgerEntry {
  Amendments?: string[],
  Majorities?: any[],
  Flags: 0,
  LedgerEntryType: 'Amendments'
}

export interface CheckLedgerEntry {
  LedgerEntryType: 'Check',
  Account: string,
  Destination, string,
  Flags: 0,
  OwnerNode: string,
  PreviousTxnID: string,
  PreviousTxnLgrSeq: number,
  SendMax: string | object,
  Sequence: number,
  DestinationNode: string,
  DestinationTag: number,
  Expiration: number,
  InvoiceID: string,
  SourceTag: number
}

export interface PayChannelLedgerEntry {
  LedgerEntryType: 'PayChannel',
  Sequence: number,
  Account: string,
  Amount: string,
  Balance: string,
  PublicKey: string,
  Destination: string,
  SettleDelay: number,
  Expiration?: number,
  CancelAfter?: number,
  SourceTag?: number,
  DestinationTag?: number,
  OwnerNode: string,
  PreviousTxnID: string,
  PreviousTxnLgrSeq: number,
  index: string
}

export interface SignerListLedgerEntry {
  LedgerEntryType: 'SignerList',
  OwnerNode: string,
  SignerQuorum: number,
  SignerEntries: SignerEntry[],
  SignerListID: number,
  PreviousTxnID: string,
  PreviousTxnLgrSeq: number
}

// TODO: Add the other ledger entry types, then remove the `any` fallback
// see https://ripple.com/build/ledger-format/#ledger-object-types
export type LedgerEntry =
  AccountRootLedgerEntry |
  AmendmentsLedgerEntry |
  PayChannelLedgerEntry |
  SignerListLedgerEntry |
  any
