import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

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
   * Amount of currency to add to the channel. Can either be a string
   * value of XRP in drops or a issued currency dictionary with string
   * keys and string values.
   */
  Amount: string | Record<string, string>
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
 * Verify the form and type of a PaymentChannelFund at runtime.
 *
 * @param tx - A PaymentChannelFund Transaction.
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

  if (
    typeof tx.Amount !== 'string' &&
    !(typeof tx.Amount === 'object' && tx.Amount !== null && !Array.isArray(tx.Amount) &&
      Object.entries(tx.Amount).every(
        ([key, value]) => typeof key === 'string' && typeof value === 'string'
      ))
  ) {
    throw new ValidationError(
      'PaymentChannelFund: Amount must be a string or an object with string keys and string values'
    )
  }

  if (tx.Expiration !== undefined && typeof tx.Expiration !== 'number') {
    throw new ValidationError('PaymentChannelFund: Expiration must be a number')
  }
}
