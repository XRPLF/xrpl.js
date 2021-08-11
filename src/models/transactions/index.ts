import Metadata from "../common/metadata";


export type Transaction = never // (For now)
//     AccountSet
//   | AccountDelete
//   | CheckCancel
//   | CheckCash
//   | CheckCreate
//   | DepositPreauth
//   | EscrowCancel
//   | EscrowCreate
//   | EscrowFinish
//   | OfferCancel
//   | OfferCreate
//   | PaymentTransaction
//   | PaymentChannelClaim
//   | PaymentChannelCreate
//   | PaymentChannelFund
//   | SetRegularKey
//   | SignerListSet
//   | TicketCreate
//   | TrustSet

export interface TransactionAndMetadata {
    transaction: Transaction;
    metadata: Metadata
}