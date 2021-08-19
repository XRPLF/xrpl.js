import Metadata from "../common/metadata";
import { AccountDelete } from "./accountDelete";
import { AccountSet } from "./accountSet";
import { CheckCancel } from "./checkCancel";
import { CheckCash } from "./checkCash";
import { CheckCreate } from "./checkCreate";
import { DepositPreauth } from "./depositPreauth"
import { EscrowCreate } from "./escrowCreate"
import { EscrowCancel } from './escrowCancel'
import { EscrowFinish } from "./escrowFinish"
import { OfferCancel } from "./offerCancel"
import { OfferCreate } from "./offerCreate"
import { PaymentTransaction } from "./paymentTransaction"
import { PaymentChannelClaim } from './paymentChannelClaim'
import { PaymentChannelCreate } from "./paymentChannelCreate"
import { PaymentChannelFund } from "./paymentChannelFund"
import { SignerListSet } from "./signerListSet"
import { TicketCreate } from "./ticketCreate"
import { TrustSet } from "./trustSet"

export type Transaction =
       AccountDelete
     | AccountSet
     | CheckCancel
     | CheckCash
     | CheckCreate
     | DepositPreauth
     | EscrowCancel
     | EscrowCreate
     | EscrowFinish
     | OfferCancel
     | OfferCreate
     | PaymentTransaction
     | PaymentChannelClaim
     | PaymentChannelCreate
     | PaymentChannelFund
//   | SetRegularKey
     | SignerListSet
     | TicketCreate
     | TrustSet

export interface TransactionAndMetadata {
    transaction: Transaction
    metadata: Metadata
}
