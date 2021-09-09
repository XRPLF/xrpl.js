import Metadata from "../common/metadata";

import { AccountDelete, verifyAccountDelete } from "./accountDelete";
import { AccountSet, verifyAccountSet } from "./accountSet";
import { CheckCancel, verifyCheckCancel } from "./checkCancel";
import { CheckCash, verifyCheckCash } from "./checkCash";
import { CheckCreate, verifyCheckCreate } from "./checkCreate";
import { DepositPreauth, verifyDepositPreauth } from "./depositPreauth";
import { EscrowCreate, verifyEscrowCreate } from "./escrowCreate";
import { EscrowCancel, verifyEscrowCancel } from "./escrowCancel";
import { EscrowFinish, verifyEscrowFinish } from "./escrowFinish";
import { OfferCancel, verifyOfferCancel } from "./offerCancel";
import { OfferCreate, verifyOfferCreate } from "./offerCreate";
import {
  PaymentTransaction,
  verifyPaymentTransaction,
} from "./paymentTransaction";
import {
  PaymentChannelClaim,
  verifyPaymentChannelClaim,
} from "./paymentChannelClaim";
import {
  PaymentChannelCreate,
  verifyPaymentChannelCreate,
} from "./paymentChannelCreate";
import {
  PaymentChannelFund,
  verifyPaymentChannelFund,
} from "./paymentChannelFund";
import { SetRegularKey, verifySetRegularKey } from "./setRegularKey";
import { SignerListSet, verifySignerListSet } from "./signerListSet";
import { TicketCreate, verifyTicketCreate } from "./ticketCreate";
import { TrustSet, verifyTrustSet } from "./trustSet";
import { ValidationError } from "../../common/errors";
import { isEqual, omitBy, isUndefined } from "lodash";
import { encode, decode } from "ripple-binary-codec";

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
     | SetRegularKey
     | SignerListSet
     | TicketCreate
     | TrustSet

export interface TransactionAndMetadata {
    transaction: Transaction
    metadata: Metadata
}

/**
 * 
 * @param {Transaction} tx A Transaction.
 * @returns {void}
 * @throws {ValidationError} When the Transaction is malformed.
 */
 export function verify(tx: Transaction): void {
   
  switch(tx.TransactionType){

    case 'AccountDelete':
      verifyAccountDelete(tx)
      break
    
    case 'AccountSet':
      verifyAccountSet(tx)
      break
    
    case 'CheckCancel':
      verifyCheckCancel(tx)
      break
    
    case 'CheckCash':
      verifyCheckCash(tx)
      break
    
    case 'CheckCreate':
      verifyCheckCreate(tx)
      break
    
    case 'DepositPreauth':
      verifyDepositPreauth(tx)
      break
    
    case 'EscrowCancel':
      verifyEscrowCancel(tx)
      break
    
    case 'EscrowCreate':
      verifyEscrowCreate(tx)
      break
    
    case 'EscrowFinish':
      verifyEscrowFinish(tx)
      break
    
    case 'OfferCancel':
      verifyOfferCancel(tx)
      break
    
    case 'OfferCreate':
      verifyOfferCreate(tx)
      break
  
    case 'Payment':
      verifyPaymentTransaction(tx)
      break
  
    case 'PaymentChannelClaim':
      verifyPaymentChannelClaim(tx)
      break
  
    case 'PaymentChannelCreate':
      verifyPaymentChannelCreate(tx)
      break
  
    case 'PaymentChannelFund':
      verifyPaymentChannelFund(tx)
      break
    
    case 'SetRegularKey':
      verifySetRegularKey(tx)
      break
  
    case 'SignerListSet':
      verifySignerListSet(tx)
      break
  
    case 'TicketCreate':
      verifyTicketCreate(tx)
      break
  
    case 'TrustSet':
      verifyTrustSet(tx)
      break

    default:
      throw new ValidationError(`Invalid field TransactionType`)
  }

  if (!isEqual(decode(encode(tx)), tx))
    throw new ValidationError(`Invalid Transaction: ${tx.TransactionType}`);
}
