import { RippledAmount } from "./amounts";
import { Memo } from "./memos";

export interface OfferCreateTransaction {
  TransactionType: "OfferCreate";
  Account: string;
  AccountTxnID?: string;
  Fee: string;
  Field: any;
  Flags: number;
  LastLedgerSequence?: number;
  Sequence: number;
  Signers: any[];
  SigningPubKey: string;
  SourceTag?: number;
  TakerGets: RippledAmount;
  TakerPays: RippledAmount;
  TxnSignature: string;
  Expiration?: number;
  Memos?: Memo[];
  OfferSequence?: number;
}

export interface SignedTransaction {
  signedTransaction: string;
  id: string;
}
