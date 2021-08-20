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
import { SetRegularKey } from "./setRegularKey";
import { SignerListSet } from "./signerListSet"
import { TicketCreate } from "./ticketCreate"
import { TrustSet } from "./trustSet"
import { ValidationError } from '../../common/errors'
import { isEqual } from 'lodash';
import { encode, decode } from 'ripple-binary-codec'
import { verifyAccountDelete,
         verifyAccountSet, 
         verifyCheckCancel, 
         verifyCheckCash, 
         verifyCheckCreate, 
         verifyDepositPreauth, 
         verifyEscrowCancel, 
         verifyEscrowCreate, 
         verifyEscrowFinish, 
         verifyOfferCancel, 
         verifyOfferCreate, 
         verifyPaymentChannelClaim, 
         verifyPaymentChannelCreate, 
         verifyPaymentChannelFund, 
         verifyPaymentTransaction, 
         verifySetRegularKey, 
         verifySignerListSet, 
         verifyTicketCreate, 
         verifyTrustSet } from ".";

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
 export function verify(tx: Transaction) {
    
  if(!isEqual(decode(encode(tx)),tx))
      throw new ValidationError(`Invalid Transaction: ${tx.TransactionType}`)

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
      throw new ValidationError(`Invalid TransactionType`)
  }
  
}