import {
  Account,
  BaseTransaction,
  isAccount,
  isHexString,
  isNumber,
  isXRPAmount,
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
   * Amount of XRP, in drops, to deduct from the sender's balance and set aside
   * in this channel. While the channel is open, the XRP can only go to the
   * Destination address. When the channel closes, any unclaimed XRP is returned
   * to the source address's balance.
   */
  Amount: string
  /**
   * Address to receive XRP claims against this channel. This is also known as
   * the "destination address" for the channel.
   */
  Destination: Account
  /**
   * Arbitrary tag to further specify the destination for this payment channel,
   * such as a hosted recipient at the destination address.
   */
  DestinationTag?: number
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

  validateRequiredField(tx, 'Amount', isXRPAmount)
  validateRequiredField(tx, 'Destination', isAccount)
  validateOptionalField(tx, 'DestinationTag', isNumber)
  validateRequiredField(tx, 'SettleDelay', isNumber)
  validateRequiredField(tx, 'PublicKey', isHexString)
  validateOptionalField(tx, 'CancelAfter', isNumber)
}
