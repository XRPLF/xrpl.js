import {SignerEntry} from './index'
import {Amount, RippledAmount} from './amounts'

export interface AccountRootLedgerEntry {
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
  TickSize?: number
  TransferRate?: number
  WalletLocator?: string
  WalletSize?: number // DEPRECATED
}

export interface AmendmentsLedgerEntry {
  LedgerEntryType: 'Amendments'
  Amendments?: string[]
  Majorities?: any[]
  Flags: 0
}

export interface CheckLedgerEntry {
  LedgerEntryType: 'Check'
  Account: string
  Destination
  string
  Flags: 0
  OwnerNode: string
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
  SendMax: string | object
  Sequence: number
  DestinationNode: string
  DestinationTag: number
  Expiration: number
  InvoiceID: string
  SourceTag: number
}

export interface DepositPreauthLedgerEntry {
  LedgerEntryType: 'DepositPreauth'
  Account: string
  Authorize: string
  OwnerNode: string
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
}

export interface DirectoryNodeLedgerEntry {
  LedgerEntryType: 'DirectoryNode'
  Flags: number
  RootIndex: string
  Indexes: string[]
  IndexNext?: number
  IndexPrevious?: number
}

export interface OfferDirectoryNodeLedgerEntry
  extends DirectoryNodeLedgerEntry {
  TakerPaysCurrency: string
  TakerPaysIssuer: string
  TakerGetsCurrency: string
  TakerGetsIssuer: string
  ExchangeRate?: number // DEPRECATED
}

export interface OwnerDirectoryNodeLedgerEntry
  extends DirectoryNodeLedgerEntry {
  Owner: string
}

export interface EscrowLedgerEntry {
  LedgerEntryType: 'Escrow'
  Account: string
  Destination: string
  Amount: string
  Condition?: string
  CancelAfter?: number
  FinishAfter?: number
  Flags: number
  SourceTag?: number
  DestinationTag?: number
  OwnerNode: string
  DestinationNode?: string
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
}

export interface FeeSettingsLedgerEntry {
  LedgerEntryType: 'FeeSettings'
  BaseFee: string
  ReferenceFeeUnits: number
  ReserveBase: number
  ReserveIncrement: number
  Flags: number
}

export interface LedgerHashesLedgerEntry {
  LedgerEntryType: 'LedgerHashes'
  Hashes: string[]
  Flags: number
  FirstLedgerSequence?: number // DEPRECATED
  LastLedgerSequence?: number
}

export interface OfferLedgerEntry {
  LedgerEntryType: 'Offer'
  Flags: number
  Account: string
  Sequence: number
  TakerPays: RippledAmount
  TakerGets: RippledAmount
  BookDirectory: string
  BookNode: string
  OwnerNode: string
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
  Expiration?: number
}

export interface PayChannelLedgerEntry {
  LedgerEntryType: 'PayChannel'
  Sequence: number
  Account: string
  Amount: string
  Balance: string
  PublicKey: string
  Destination: string
  SettleDelay: number
  Expiration?: number
  CancelAfter?: number
  SourceTag?: number
  DestinationTag?: number
  OwnerNode: string
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
  index: string
}

export interface RippleStateLedgerEntry {
  LedgerEntryType: 'RippleState'
  Flags: number
  Balance: Amount
  LowLimit: Amount
  HighLimit: Amount
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
  LowNode?: string
  HighNode?: string
  LowQualityIn?: number
  LowQualityOut?: number
  HighQualityIn?: number
  HighQualityOut?: number
}

export interface SignerListLedgerEntry {
  LedgerEntryType: 'SignerList'
  OwnerNode: string
  SignerQuorum: number
  SignerEntries: { SignerEntry: SignerEntry }[]
  SignerListID: number
  PreviousTxnID: string
  PreviousTxnLgrSeq: number
}

// see https://ripple.com/build/ledger-format/#ledger-object-types
export type LedgerEntry =
  | AccountRootLedgerEntry
  | AmendmentsLedgerEntry
  | CheckLedgerEntry
  | DepositPreauthLedgerEntry
  | DirectoryNodeLedgerEntry
  | OfferDirectoryNodeLedgerEntry
  | OwnerDirectoryNodeLedgerEntry
  | EscrowLedgerEntry
  | FeeSettingsLedgerEntry
  | LedgerHashesLedgerEntry
  | OfferLedgerEntry
  | PayChannelLedgerEntry
  | RippleStateLedgerEntry
  | SignerListLedgerEntry
