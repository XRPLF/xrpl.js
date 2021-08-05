
export interface Memo {
  MemoData?: string;
  MemoType?: string;
  MemoFormat?: string;
}

export interface XrpLedgerTransaction {
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

export interface AccountSetTransaction extends XrpLedgerTransaction {
  TransactionType: "AccountSet";
  ClearFlag?: number;
  Domain?: string;
  EmailHash?: string;
  MessageKey?: string;
  SetFlag?: number;
  TransferRate?: number;
  TickSize?: number;
}

export interface AccountDeleteTransaction extends XrpLedgerTransaction {
  TransactionType: "AccountDelete";
  Destination: string;
  DestinationTag?: number;
}

export interface CheckCancelTransaction extends XrpLedgerTransaction {
  TransactionType: "CheckCancel";
  CheckID: string;
}

export interface CheckCashTransaction extends XrpLedgerTransaction {
  TransactionType: "CheckCash";
  CheckID: string;
  Amount: string;
  DeliverMin: string;
}

export interface CheckCreateTransaction extends XrpLedgerTransaction {
  TransactionType: "CheckCreate";
  Destination: string;
  SendMax: string;
  DestinationTag?: number;
  Expiration?: number;
  InvoiceID?: string;
}

export interface DepositPreauthTransaction extends XrpLedgerTransaction {
  TransactionType: "DepositPreauth";
  Authorize?: string;
  Unauthorize?: string;
}

export interface EscrowCancelTransaction extends XrpLedgerTransaction {
  TransactionType: "EscrowCancel";
  Owner: string;
  OfferSequence: number;
}

export interface EscrowCreateTransaction extends XrpLedgerTransaction {
  TransactionType: "EscrowCreate";
  Amount: string;
  Destination: string;
  CancelAfter?: number;
  FinishAfter?: number;
  Condition?: string;
  DestinationTag?: number;
}

export interface EscrowFinishTransaction extends XrpLedgerTransaction {
  TransactionType: "EscrowFinish";
  Owner: string;
  OfferSequence: number;
  Condition?: string;
  Fulfillment?: string;
}

export interface OfferCancelTransaction extends XrpLedgerTransaction {
  TransactionType: "OfferCancel";
  OfferSequence?: number;
}

export interface OfferCreateTransaction extends XrpLedgerTransaction {
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

export interface PaymentTransaction extends XrpLedgerTransaction {
  TransactionType: "Payment";
  Amount: string;
  Destination: string;
  DestinationTag?: number;
  InvoiceID?: number;
  Paths: Array<Path>;
  SendMax: string;
  DeliverMin: string;
}

export interface PaymentChannelClaimTransaction extends XrpLedgerTransaction {
  TransactionType: "PaymentChannelClaim";
  Channel: string;
  Balance?: string;
  Amount?: string;
  Signature?: string;
  PublicKey?: string;
}

export interface PaymentChannelCreateTransaction extends XrpLedgerTransaction {
  TransactionType: "PaymentChannelCreate";
  Amount: string;
  Destination: string;
  SettleDelay: number;
  PublicKey: string;
  CancelAfter?: number;
  DestinationTag?: number;
}

export interface PaymentChannelFundTransaction extends XrpLedgerTransaction {
  TransactionType: "PaymentChannelFund";
  Channel: string;
  Amount: string;
  Expiration?: number;
}

export interface SetRegularKeyTransaction extends XrpLedgerTransaction {
  TransactionType: "SetRegularKey";
  RegularKey?: string;
}

interface SignerList {
  SignerEntry: {
    Account: string;
    SignerWeight: number;
  };
}

export interface SignerListSetTransaction extends XrpLedgerTransaction {
  TransactionType: "SignerListSet";
  SignerQuorum: number;
  SignerEntries?: Array<SignerList>;
}

export interface TicketCreateTransaction extends XrpLedgerTransaction {
  TransactionType: "TicketCreate";
  TicketCount: number;
}

export interface TrustSetTransaction extends XrpLedgerTransaction {
  TransactionType: "TrustSet";
  LimitAmount: string;
  QualityIn?: number;
  QualityOut?: number;
}