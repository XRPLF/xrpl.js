/* eslint-disable complexity -- verifies 19 tx types hence a lot of checks needed */
/* eslint-disable max-lines-per-function -- need to work with a lot of Tx verifications */

import _ from 'lodash'
import { encode, decode } from 'ripple-binary-codec'

import { ValidationError } from '../../errors'
import setTransactionFlagsToNumber from '../utils/flags'

import { AccountDelete, validateAccountDelete } from './accountDelete'
import { AccountSet, validateAccountSet } from './accountSet'
import { CheckCancel, validateCheckCancel } from './checkCancel'
import { CheckCash, validateCheckCash } from './checkCash'
import { CheckCreate, validateCheckCreate } from './checkCreate'
import { DepositPreauth, validateDepositPreauth } from './depositPreauth'
import { EscrowCancel, validateEscrowCancel } from './escrowCancel'
import { EscrowCreate, validateEscrowCreate } from './escrowCreate'
import { EscrowFinish, validateEscrowFinish } from './escrowFinish'
import TransactionMetadata from './metadata'
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
import { SetRegularKey, validateSetRegularKey } from './setRegularKey'
import { SignerListSet, validateSignerListSet } from './signerListSet'
import { TicketCreate, validateTicketCreate } from './ticketCreate'
import { TrustSet, validateTrustSet } from './trustSet'

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

    case 'SignerListSet':
      validateSignerListSet(tx)
      break

    case 'TicketCreate':
      validateTicketCreate(tx)
      break

    case 'TrustSet':
      validateTrustSet(tx)
      break

    default:
      throw new ValidationError(
        `Invalid field TransactionType: ${tx.TransactionType}`,
      )
  }

  if (
    !_.isEqual(
      decode(encode(tx)),
      _.omitBy(tx, (value) => value == null),
    )
  ) {
    throw new ValidationError(`Invalid Transaction: ${tx.TransactionType}`)
  }
}
