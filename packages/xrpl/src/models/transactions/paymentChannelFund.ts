import { ValidationError } from '../../errors'
import { Amount } from '../common'

import { BaseTransaction, validateBaseTransaction, isAmount } from './common'

/**
 * Add additional amount to an open payment channel, and optionally update the
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
   * Amount to add to the channel. Must be a positive amount
   */
  Amount: Amount
  /**
   * New Expiration time to set for the channel in seconds since the Ripple
   * Epoch. This must be later than either the current time plus the SettleDelay
   * of the channel, or the existing Expiration of the channel. After the
   * Expiration time, any transaction that would access the channel closes the
   * channel without taking its normal action. Any unspent amount is returned to
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

  if (tx.Channel === undefined) {
    throw new ValidationError('PaymentChannelFund: missing Channel')
  }

  if (typeof tx.Channel !== 'string') {
    throw new ValidationError('PaymentChannelFund: Channel must be a string')
  }

  if (tx.Amount === undefined) {
    throw new ValidationError('PaymentChannelFund: missing Amount')
  }

  if (typeof tx.Amount !== 'string' && !isAmount(tx.Amount)) {
    throw new ValidationError('PaymentChannelFund: Amount must be an Amount')
  }

  if (tx.Expiration !== undefined && typeof tx.Expiration !== 'number') {
    throw new ValidationError('PaymentChannelFund: Expiration must be a number')
  }
}
