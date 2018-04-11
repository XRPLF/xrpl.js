import {SignerEntry} from './index'

export interface AccountRootLedgerEntry {
  LedgerEntryType: 'AccountRoot',
  Account: string,
  Balance: string,
  Flags: number,
  OwnerCount: number,
  PreviousTxnID: string,
  PreviousTxnLgrSeq: number,
  Sequence: number,
  AccountTxnID?: string,
  Domain?: string,
  EmailHash?: string,
  MessageKey?: string
  RegularKey?: string,
  TickSize?: number,
  TransferRate?: number,
  WalletLocator?: string, // DEPRECATED
  WalletSize?: number // DEPRECATED
}

export interface AmendmentsLedgerEntry {
  LedgerEntryType: 'Amendments',
  Amendments?: string[],
  Majorities?: any[],
  Flags: 0
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
