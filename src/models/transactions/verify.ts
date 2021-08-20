import { ValidationError } from '../../common/errors'
import { Transaction } from '.'
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

export function verify(tx: Transaction) {
    
    if(!isEqual(decode(encode(tx)),tx))
        throw new ValidationError(`Invalid Transaction: ${tx.TransactionType}`)

    if (tx.TransactionType === 'AccountDelete')
        verifyAccountDelete(tx)
    
    if (tx.TransactionType === 'AccountSet')
        verifyAccountSet(tx)
    
    if (tx.TransactionType === 'CheckCancel')
        verifyCheckCancel(tx)
    
    if (tx.TransactionType === 'CheckCash')
        verifyCheckCash(tx)
    
    if (tx.TransactionType === 'CheckCreate')
        verifyCheckCreate(tx)
    
    if (tx.TransactionType === 'DepositPreauth')
        verifyDepositPreauth(tx)
    
    if (tx.TransactionType === 'EscrowCancel')
        verifyEscrowCancel(tx)
    
    if (tx.TransactionType === 'EscrowCreate')
        verifyEscrowCreate(tx)
    
    if (tx.TransactionType === 'EscrowFinish')
        verifyEscrowFinish(tx)
    
    if (tx.TransactionType === 'OfferCancel')
        verifyOfferCancel(tx)
    
    if (tx.TransactionType === 'OfferCreate')
        verifyOfferCreate(tx)

    if (tx.TransactionType === 'Payment')
        verifyPaymentTransaction(tx)

    if (tx.TransactionType === 'PaymentChannelClaim')
        verifyPaymentChannelClaim(tx)

    if (tx.TransactionType === 'PaymentChannelCreate')
        verifyPaymentChannelCreate(tx)

    if (tx.TransactionType === 'PaymentChannelFund')
        verifyPaymentChannelFund(tx)
    
    if (tx.TransactionType === 'SetRegularKey')
        verifySetRegularKey(tx)

    if (tx.TransactionType === 'SignerListSet')
        verifySignerListSet(tx)

    if (tx.TransactionType === 'TicketCreate')
        verifyTicketCreate(tx)

    if (tx.TransactionType === 'TrustSet')
        verifyTrustSet(tx)
}