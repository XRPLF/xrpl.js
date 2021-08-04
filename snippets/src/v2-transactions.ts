import { tx_json } from "../../src/common/validate"

export interface Memo {
  MemoData?: string;
  MemoType?: string;
  MemoFormat?: string;
}

interface BaseTransaction {
  Account: string;
  TransactionType: string;
  Fee?: string;
  Sequence?: number;
  AccountTxnID?: string;
  Flags?: number;
  LastLedgerSequence?: number;
  Memos?: Array<{ Memo: Memo }>;
  Signers?: Array<string>;
  SourceTag?: number;
  SigningPublicKey?: string;
  TicketSequence?: number;
  TxnSignature?: string;
}

export interface AccountSetTransaction extends BaseTransaction {
  TransactionType: "AccountSet";
  ClearFlag?: number;
  Domain?: string;
  EmailHash?: string;
  MessageKey?: string;
  SetFlag?: number;
  TransferRate?: number;
  TickSize?: number;
}

export interface AccountDeleteTransaction extends BaseTransaction {
  TransactionType: "AccountDelete";
  Destination: string;
  DestinationTag?: number;
}

export interface CheckCancelTransaction extends BaseTransaction {
  TransactionType: "CheckCancel";
  CheckID: string;
}

export interface CheckCashTransaction extends BaseTransaction {
  TransactionType: "CheckCash";
  CheckID: string;
  Amount: string;
  DeliverMin: string;
}

export interface CheckCreateTransaction extends BaseTransaction {
  TransactionType: "CheckCreate";
  Destination: string;
  SendMax: string;
  DestinationTag?: number;
  Expiration?: number;
  InvoiceID?: string;
}

export interface DepositPreauthTransaction extends BaseTransaction {
  TransactionType: "DepositPreauth";
  Authorize?: string;
  Unauthorize?: string;
}

export interface EscrowCancelTransaction extends BaseTransaction {
  TransactionType: "EscrowCancel";
  Owner: string;
  OfferSequence: number;
}

export interface EscrowCreateTransaction extends BaseTransaction {
  TransactionType: "EscrowCreate";
  Amount: string;
  Destination: string;
  CancelAfter?: number;
  FinishAfter?: number;
  Condition?: string;
  DestinationTag?: number;
}

export interface EscrowFinishTransaction extends BaseTransaction {
  TransactionType: "EscrowFinish";
  Owner: string;
  OfferSequence: number;
  Condition?: string;
  Fulfillment?: string;
}

export interface OfferCancelTransaction extends BaseTransaction {
  TransactionType: "OfferCancel";
  OfferSequence?: number;
}

export interface OfferCreateTransaction extends BaseTransaction {
  TransactionType: "OfferCreate";
  Expiration?: number;
  OfferSequence?: number;
  TakerGets: string;
  TakerPays: string;
}

interface Path {
  account?: string;
  currency?: string;
  issuer?: string;
}

export interface PaymentTransaction extends BaseTransaction {
  TransactionType: "Payment";
  Amount: string;
  Destination: string;
  DestinationTag?: number;
  InvoiceID?: number;
  Paths: Array<Path>;
  SendMax: string;
  DeliverMin: string;
}

export interface PaymentChannelClaimTransaction extends BaseTransaction {
  TransactionType: "PaymentChannelClaim";
  Channel: string;
  Balance?: string;
  Amount?: string;
  Signature?: string;
  PublicKey?: string;
}

export interface PaymentChannelCreateTransaction extends BaseTransaction {
  TransactionType: "PaymentChannelCreate";
  Amount: string;
  Destination: string;
  SettleDelay: number;
  PublicKey: string;
  CancelAfter?: number;
  DestinationTag?: number;
}

export interface PaymentChannelFundTransaction extends BaseTransaction {
  TransactionType: "PaymentChannelFund";
  Channel: string;
  Amount: string;
  Expiration?: number;
}

export interface SetRegularKeyTransaction extends BaseTransaction {
  TransactionType: "SetRegularKey";
  RegularKey?: string;
}

interface SignerList {
  SignerEntry: {
    Account: string;
    SignerWeight: number;
  };
}

export interface SignerListSetTransaction extends BaseTransaction {
  TransactionType: "SignerListSet";
  SignerQuorum: number;
  SignerEntries?: Array<SignerList>;
}

export interface TicketCreateTransaction extends BaseTransaction {
  TransactionType: "TicketCreate";
  TicketCount: number;
}

export interface TrustSetTransaction extends BaseTransaction {
  TransactionType: "TrustSet";
  LimitAmount: string;
  QualityIn?: number;
  QualityOut?: number;
}

// export type XrpLedgerTransaction = AccountSetTransaction
//   | AccountDeleteTransaction
//   | CheckCancelTransaction
//   | CheckCashTransaction
//   | CheckCreateTransaction
//   | DepositPreauthTransaction
//   | EscrowCancelTransaction
//   | EscrowCreateTransaction
//   | EscrowFinishTransaction
//   | OfferCancelTransaction
//   | OfferCreateTransaction
//   | PaymentTransaction
//   | PaymentChannelClaimTransaction
//   | PaymentChannelCreateTransaction
//   | PaymentChannelFundTransaction
//   | SetRegularKeyTransaction
//   | SignerListSetTransaction
//   | TicketCreateTransaction
//   | TrustSetTransaction

export type XrpLedgerTransaction = OfferCreateTransaction | PaymentTransaction