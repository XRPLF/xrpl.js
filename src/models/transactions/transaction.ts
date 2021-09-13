/* eslint-disable complexity -- verifies 19 tx types hence a lot of checks needed */
/* eslint-disable max-lines-per-function -- need to work with a lot of Tx verifications */
/* eslint-disable import/max-dependencies -- need to test more than 5 TxTypes */

import _ from 'lodash'
import { encode, decode } from 'ripple-binary-codec'

import { ValidationError } from '../../common/errors'
import TransactionMetadata from './metadata'

import { AccountDelete, verifyAccountDelete } from './accountDelete'
import {
  AccountSet,
  verifyAccountSet,
  AccountSetFlags,
  AccountSetTransactionFlags,
} from './accountSet'
import { CheckCancel, verifyCheckCancel } from './checkCancel'
import { CheckCash, verifyCheckCash } from './checkCash'
import { CheckCreate, verifyCheckCreate } from './checkCreate'
import { DepositPreauth, verifyDepositPreauth } from './depositPreauth'
import { EscrowCancel, verifyEscrowCancel } from './escrowCancel'
import { EscrowCreate, verifyEscrowCreate } from './escrowCreate'
import { EscrowFinish, verifyEscrowFinish } from './escrowFinish'
import { OfferCancel, verifyOfferCancel } from './offerCancel'
import {
  OfferCreate,
  verifyOfferCreate,
  OfferCreateTransactionFlags,
} from './offerCreate'
import {
  PaymentChannelClaim,
  verifyPaymentChannelClaim,
  PaymentChannelClaimTransactionFlags,
} from './paymentChannelClaim'
import {
  PaymentChannelCreate,
  verifyPaymentChannelCreate,
} from './paymentChannelCreate'
import {
  PaymentChannelFund,
  verifyPaymentChannelFund,
} from './paymentChannelFund'
import { Payment, verifyPayment, PaymentTransactionFlags } from './payment'
import { SetRegularKey, verifySetRegularKey } from './setRegularKey'
import { SignerListSet, verifySignerListSet } from './signerListSet'
import { TicketCreate, verifyTicketCreate } from './ticketCreate'
import { TrustSet, verifyTrustSet, TrustSetTransactionFlags } from './trustSet'
import { setTransactionFlagsToNumber } from '../utils'

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
  metadata: TransactionMetadata
}

/**
 * Verifies various Transaction Types.
 * Encode/decode and individual type validation.
 *
 * @param tx - A Transaction.
 * @throws ValidationError When the Transaction is malformed.
 */
export function verify(transaction: Record<string, unknown>): void {
  const tx = { ...transaction }
  setTransactionFlagsToNumber(tx as unknown as Transaction)
  switch (tx.TransactionType) {
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
      verifyPayment(tx)
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

export {
  AccountSetFlags,
  AccountSetTransactionFlags,
  OfferCreateTransactionFlags,
  PaymentTransactionFlags,
  PaymentChannelClaimTransactionFlags,
  TrustSetTransactionFlags,
}
