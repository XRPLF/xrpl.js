import Metadata from "../common/metadata";
import { OfferCreate } from "./offerCreate";


export type Transaction =
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
      OfferCreate
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