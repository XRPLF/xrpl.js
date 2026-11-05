import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'

import {
  BaseTransaction,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
  isHexString,
} from './common'
import {
  validatePayChanAmount,
  validatePayChanIssuedCurrency,
} from './paymentChannelCreate'

/**
 * Add additional XRP to an open payment channel, and optionally update the
 * expiration time of the channel. Only the source address of the channel can
 * use this transaction.
 *
 * @category Transaction Models
 */
export interface PaymentChannelFund extends BaseTransaction {
  TransactionType: 'PaymentChannelFund'
  /**
   * The unique ID of the channel to fund as a 64-character hexadecimal
   * string.
   */
  Channel: string
  /**
   * Amount to add to the channel: XRP in drops, or (TokenPaychan) an IOU or MPT
   * amount in the channel's asset. Must be greater than 0.
   */
  Amount: Amount | MPTAmount
  /**
   * New Expiration time to set for the channel in seconds since the Ripple
   * Epoch. This must be later than either the current time plus the SettleDelay
   * of the channel, or the existing Expiration of the channel. After the
   * Expiration time, any transaction that would access the channel closes the
   * channel without taking its normal action. Any unspent XRP is returned to
   * the source address when the channel closes. (Expiration is separate from
   * the channel's immutable CancelAfter time.) For more information, see the
   * PayChannel ledger object type.
   */
  Expiration?: number
}

/**
 * Verify the form and type of an PaymentChannelFund at runtime.
 *
 * @param tx - An PaymentChannelFund Transaction.
 * @throws When the PaymentChannelFund is Malformed.
 */
export function validatePaymentChannelFund(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Channel', isHexString)

  if (tx.Amount == null) {
    throw new ValidationError('PaymentChannelFund: missing field Amount')
  }

  validatePayChanAmount(tx, 'Amount')
  validatePayChanIssuedCurrency(tx, 'Amount')

  validateOptionalField(tx, 'Expiration', isNumber)
}
