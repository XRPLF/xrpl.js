import Metadata from "../common/metadata";
import { OfferCreate } from "./offerCreate";
import { CheckCash } from "./checkCash";
import { CheckCancel } from "./checkCancel";
import { CheckCreate } from "./checkCreate";
import { SignerListSet } from "./signerListSet";

export type Transaction =
//     AccountSet
//   | AccountDelete
       CheckCancel
     | CheckCash
     | CheckCreate
//   | DepositPreauth
//   | EscrowCancel
//   | EscrowCreate
//   | EscrowFinish
//   | OfferCancel
     | OfferCreate
//   | PaymentTransaction
//   | PaymentChannelClaim
//   | PaymentChannelCreate
//   | PaymentChannelFund
//   | SetRegularKey
     | SignerListSet
//   | TicketCreate
//   | TrustSet

export interface TransactionAndMetadata {
    transaction: Transaction;
    metadata: Metadata
}
