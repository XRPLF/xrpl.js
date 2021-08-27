import { BaseLedgerEntry } from "./baseLedgerEntry";

export interface PayChannel extends BaseLedgerEntry {
  LedgerEntryType: "PayChannel";
  Account: string;
  Destination: string;
  Amount: string;
  Balance: string;
  PublicKey: string;
  SettleDelay: number;
  OwnerNode: string;
  PreviousTxnID: string;
  PreviousTxnLgrSeq: number;
  Flags: number;
  Expiration?: number;
  CancelAfter?: number;
  SourceTag?: number;
  DestinationTag?: number;
  DestinationNode?: string;
}
