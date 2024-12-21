import { ValidationError } from '../../errors'

import {
  Account,
  BaseTransaction,
  isAccount,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Create a unidirectional channel and fund it with XRP. The address sending
 * this transaction becomes the "source address" of the payment channel.
 *
 * @category Transaction Models
 */
export interface PaymentChannelCreate extends BaseTransaction {
  TransactionType: 'PaymentChannelCreate'
  /**
   * Amount of currency to deduct from the sender's balance and set aside
   * in this channel. Can either be a string
   * value of XRP in drops or an issued currency dictionary with string
   * keys and string values. While the channel is open, the XRP can only go to the
   * Destination address. When the channel closes, any unclaimed XRP is returned
   * to the source address's balance.
   */
  Amount: string | Record<string, string>
  /**
   * Address to receive XRP claims against this channel. This is also known as
   * the "destination address" for the channel.
   */
  Destination: Account
  /**
   * Amount of time the source address must wait before closing the channel if
   * it has unclaimed XRP.
   */
  SettleDelay: number
  /**
   * The public key of the key pair the source will use to sign claims against
   * this channel in hexadecimal. This can be any secp256k1 or ed25519 public
   * key.
   */
  PublicKey: string
  /**
   * The time, in seconds since the Ripple Epoch, when this channel expires.
   * Any transaction that would modify the channel after this time closes the
   * channel without otherwise affecting it. This value is immutable; the
   * channel can be closed earlier than this time but cannot remain open after
   * this time.
   */
  CancelAfter?: number
  /**
   * Arbitrary tag to further specify the destination for this payment channel,
   * such as a hosted recipient at the destination address.
   */
  DestinationTag?: number
}

/**
 * Verify the form and type of a PaymentChannelCreate at runtime.
 *
 * @param tx - A PaymentChannelCreate Transaction.
 * @throws When the PaymentChannelCreate is Malformed.
 */
export function validatePaymentChannelCreate(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.Amount === undefined) {
    throw new ValidationError('PaymentChannelCreate: missing Amount')
  }

  if (
    typeof tx.Amount !== 'string' &&
    !(typeof tx.Amount === 'object' && tx.Amount !== null && !Array.isArray(tx.Amount) &&
      Object.entries(tx.Amount).every(
        ([key, value]) => typeof key === 'string' && typeof value === 'string'
      ))
  ) {
    throw new ValidationError(
      'PaymentChannelCreate: Amount must be a string or an object with string keys and string values',
    )
  }

  validateRequiredField(tx, 'Destination', isAccount)
  validateOptionalField(tx, 'DestinationTag', isNumber)

  if (tx.SettleDelay === undefined) {
    throw new ValidationError('PaymentChannelCreate: missing SettleDelay')
  }

  if (typeof tx.SettleDelay !== 'number') {
    throw new ValidationError(
      'PaymentChannelCreate: SettleDelay must be a number',
    )
  }

  if (tx.PublicKey === undefined) {
    throw new ValidationError('PaymentChannelCreate: missing PublicKey')
  }

  if (typeof tx.PublicKey !== 'string') {
    throw new ValidationError(
      'PaymentChannelCreate: PublicKey must be a string',
    )
  }

  if (tx.CancelAfter !== undefined && typeof tx.CancelAfter !== 'number') {
    throw new ValidationError(
      'PaymentChannelCreate: CancelAfter must be a number',
    )
  }
}
