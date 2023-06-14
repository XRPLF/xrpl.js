/* eslint-disable complexity -- verifies 19 tx types hence a lot of checks needed */
/* eslint-disable max-lines-per-function -- need to work with a lot of Tx verifications */

import { ValidationError } from '../../errors'
import { setTransactionFlagsToNumber } from '../utils/flags'

import { AccountDelete, validateAccountDelete } from './accountDelete'
import { AccountSet, validateAccountSet } from './accountSet'
import { CheckCancel, validateCheckCancel } from './checkCancel'
import { CheckCash, validateCheckCash } from './checkCash'
import { CheckCreate, validateCheckCreate } from './checkCreate'
import { DepositPreauth, validateDepositPreauth } from './depositPreauth'
import { EscrowCancel, validateEscrowCancel } from './escrowCancel'
import { EscrowCreate, validateEscrowCreate } from './escrowCreate'
import { EscrowFinish, validateEscrowFinish } from './escrowFinish'
import { Import, validateImport } from './import'
import { Invoke, validateInvoke } from './invoke'
import { TransactionMetadata } from './metadata'
import {
  NFTokenAcceptOffer,
  validateNFTokenAcceptOffer,
} from './NFTokenAcceptOffer'
import { NFTokenBurn, validateNFTokenBurn } from './NFTokenBurn'
import {
  NFTokenCancelOffer,
  validateNFTokenCancelOffer,
} from './NFTokenCancelOffer'
import {
  NFTokenCreateOffer,
  validateNFTokenCreateOffer,
} from './NFTokenCreateOffer'
import { NFTokenMint, validateNFTokenMint } from './NFTokenMint'
import { OfferCancel, validateOfferCancel } from './offerCancel'
import { OfferCreate, validateOfferCreate } from './offerCreate'
import { Payment, validatePayment } from './payment'
import {
  PaymentChannelClaim,
  validatePaymentChannelClaim,
} from './paymentChannelClaim'
import {
  PaymentChannelCreate,
  validatePaymentChannelCreate,
} from './paymentChannelCreate'
import {
  PaymentChannelFund,
  validatePaymentChannelFund,
} from './paymentChannelFund'
import { SetHook, validateSetHook } from './setHook'
import { SetRegularKey, validateSetRegularKey } from './setRegularKey'
import { SignerListSet, validateSignerListSet } from './signerListSet'
import { TicketCreate, validateTicketCreate } from './ticketCreate'
import { TrustSet, validateTrustSet } from './trustSet'
import { URITokenBurn, validateURITokenBurn } from './uriTokenBurn'
import { URITokenBuy, validateURITokenBuy } from './uriTokenBuy'
import {
  URITokenCancelSellOffer,
  validateURITokenCancelSellOffer,
} from './uriTokenCancelSellOffer'
import {
  URITokenCreateSellOffer,
  validateURITokenCreateSellOffer,
} from './uriTokenCreateSellOffer'
import { URITokenMint, validateURITokenMint } from './uriTokenMint'

/**
 * @category Transaction Models
 */
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
  | Import
  | Invoke
  | NFTokenAcceptOffer
  | NFTokenBurn
  | NFTokenCancelOffer
  | NFTokenCreateOffer
  | NFTokenMint
  | OfferCancel
  | OfferCreate
  | Payment
  | PaymentChannelClaim
  | PaymentChannelCreate
  | PaymentChannelFund
  | SetHook
  | SetRegularKey
  | SignerListSet
  | TicketCreate
  | TrustSet
  | URITokenBurn
  | URITokenBuy
  | URITokenCancelSellOffer
  | URITokenMint
  | URITokenCreateSellOffer

/**
 * @category Transaction Models
 */
export interface TransactionAndMetadata {
  transaction: Transaction
  metadata: TransactionMetadata
}

/**
 * Verifies various Transaction Types.
 * Encode/decode and individual type validation.
 *
 * @param transaction - A Transaction.
 * @throws ValidationError When the Transaction is malformed.
 * @category Utilities
 */
export function validate(transaction: Record<string, unknown>): void {
  const tx = { ...transaction }
  if (tx.TransactionType == null) {
    throw new ValidationError('Object does not have a `TransactionType`')
  }
  if (typeof tx.TransactionType !== 'string') {
    throw new ValidationError("Object's `TransactionType` is not a string")
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- okay here
  setTransactionFlagsToNumber(tx as unknown as Transaction)
  switch (tx.TransactionType) {
    case 'AccountDelete':
      validateAccountDelete(tx)
      break

    case 'AccountSet':
      validateAccountSet(tx)
      break

    case 'CheckCancel':
      validateCheckCancel(tx)
      break

    case 'CheckCash':
      validateCheckCash(tx)
      break

    case 'CheckCreate':
      validateCheckCreate(tx)
      break

    case 'DepositPreauth':
      validateDepositPreauth(tx)
      break

    case 'EscrowCancel':
      validateEscrowCancel(tx)
      break

    case 'EscrowCreate':
      validateEscrowCreate(tx)
      break

    case 'EscrowFinish':
      validateEscrowFinish(tx)
      break

    case 'Import':
      validateImport(tx)
      break

    case 'Invoke':
      validateInvoke(tx)
      break

    case 'NFTokenAcceptOffer':
      validateNFTokenAcceptOffer(tx)
      break

    case 'NFTokenBurn':
      validateNFTokenBurn(tx)
      break

    case 'NFTokenCancelOffer':
      validateNFTokenCancelOffer(tx)
      break

    case 'NFTokenCreateOffer':
      validateNFTokenCreateOffer(tx)
      break

    case 'NFTokenMint':
      validateNFTokenMint(tx)
      break

    case 'OfferCancel':
      validateOfferCancel(tx)
      break

    case 'OfferCreate':
      validateOfferCreate(tx)
      break

    case 'Payment':
      validatePayment(tx)
      break

    case 'PaymentChannelClaim':
      validatePaymentChannelClaim(tx)
      break

    case 'PaymentChannelCreate':
      validatePaymentChannelCreate(tx)
      break

    case 'PaymentChannelFund':
      validatePaymentChannelFund(tx)
      break

    case 'SetRegularKey':
      validateSetRegularKey(tx)
      break

    case 'SetHook':
      validateSetHook(tx)
      break

    case 'SignerListSet':
      validateSignerListSet(tx)
      break

    case 'TicketCreate':
      validateTicketCreate(tx)
      break

    case 'TrustSet':
      validateTrustSet(tx)
      break

    case 'URITokenMint':
      validateURITokenMint(tx)
      break

    case 'URITokenBurn':
      validateURITokenBurn(tx)
      break

    case 'URITokenCreateSellOffer':
      validateURITokenCreateSellOffer(tx)
      break

    case 'URITokenBuy':
      validateURITokenBuy(tx)
      break

    case 'URITokenCancelSellOffer':
      validateURITokenCancelSellOffer(tx)
      break

    default:
      throw new ValidationError(
        `Invalid field TransactionType: ${tx.TransactionType}`,
      )
  }
}
