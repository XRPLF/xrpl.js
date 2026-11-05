import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'
import { amountValue } from '../utils/amount'

import {
  Account,
  BaseTransaction,
  isAccount,
  isAmount,
  isIssuedCurrencyAmount,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
  isHexString,
} from './common'

/**
 * The currency code rippled reserves as invalid for an issued currency
 * (`badCurrency()`).
 */
const BAD_CURRENCY = 'XRP'

/**
 * Create a unidirectional channel and fund it with XRP. The address sending
 * this transaction becomes the "source address" of the payment channel.
 *
 * @category Transaction Models
 */
export interface PaymentChannelCreate extends BaseTransaction {
  TransactionType: 'PaymentChannelCreate'
  /**
   * Amount to deduct from the sender's balance and set aside in this channel:
   * XRP in drops, or (TokenPaychan) an IOU or MPT amount. While the channel is
   * open, the funds can only go to the Destination address. When the channel
   * closes, any unclaimed funds are returned to the source address's balance.
   */
  Amount: Amount | MPTAmount
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
 * Verify the form and type of an PaymentChannelCreate at runtime.
 *
 * @param tx - An PaymentChannelCreate Transaction.
 * @throws When the PaymentChannelCreate is Malformed.
 */
export function validatePaymentChannelCreate(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  if (tx.Amount == null) {
    throw new ValidationError('PaymentChannelCreate: missing field Amount')
  }

  validatePayChanAmount(tx, 'Amount')
  validatePayChanIssuedCurrency(tx, 'Amount')

  validateRequiredField(tx, 'Destination', isAccount)
  validateOptionalField(tx, 'DestinationTag', isNumber)

  validateRequiredField(tx, 'SettleDelay', isNumber)
  validateRequiredField(tx, 'PublicKey', isHexString)
  validateOptionalField(tx, 'CancelAfter', isNumber)
}

/**
 * Check that a payment channel amount field is an XRP, IOU or MPT amount
 * greater than 0. Shared by the payment channel transactions.
 *
 * @param tx - The payment channel transaction.
 * @param field - The amount field to check.
 * @throws When the field is not an amount or is not greater than 0.
 */
export function validatePayChanAmount(
  tx: Record<string, unknown>,
  field: string,
): void {
  const txType = String(tx.TransactionType)
  const amount = tx[field]
  if (!isAmount(amount)) {
    throw new ValidationError(
      `${txType}: ${field} must be an XRP, IOU or MPT amount`,
    )
  }
  if (!amountValue(amount).isGreaterThan(0)) {
    throw new ValidationError(`${txType}: ${field} must be greater than 0`)
  }
}

/**
 * Check that an IOU payment channel amount does not use the currency code
 * rippled reserves as invalid (`badCurrency()`).
 *
 * @param tx - The payment channel transaction.
 * @param field - The amount field to check.
 * @throws When the field is an IOU with the currency code XRP.
 */
export function validatePayChanIssuedCurrency(
  tx: Record<string, unknown>,
  field: string,
): void {
  const amount = tx[field]
  if (isIssuedCurrencyAmount(amount) && amount.currency === BAD_CURRENCY) {
    throw new ValidationError(
      `${String(tx.TransactionType)}: ${field} cannot be an issued currency with the code XRP`,
    )
  }
}
