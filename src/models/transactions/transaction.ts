/* eslint-disable import/max-dependencies -- All methods need to be exported */

import { AccountDelete } from './accountDelete'
import { AccountSet } from './accountSet'
import { CheckCancel } from './checkCancel'
import { CheckCash } from './checkCash'
import { CheckCreate } from './checkCreate'
import { DepositPreauth } from './depositPreauth'
import { EscrowCancel } from './escrowCancel'
import { EscrowCreate } from './escrowCreate'
import { EscrowFinish } from './escrowFinish'
import Metadata from './metadata'
import { OfferCancel } from './offerCancel'
import { OfferCreate } from './offerCreate'
import { Payment } from './payment'
import { PaymentChannelClaim } from './paymentChannelClaim'
import { PaymentChannelCreate } from './paymentChannelCreate'
import { PaymentChannelFund } from './paymentChannelFund'
import { SetRegularKey } from './setRegularKey'
import { SignerListSet } from './signerListSet'
import { TicketCreate } from './ticketCreate'
import { TrustSet } from './trustSet'

export type Transaction =
  | AccountDelete
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
  | Payment
  | PaymentChannelClaim
  | PaymentChannelCreate
  | PaymentChannelFund
  | SetRegularKey
  | SignerListSet
  | TicketCreate
  | TrustSet

export interface TransactionAndMetadata {
  transaction: Transaction
  metadata: Metadata
}
