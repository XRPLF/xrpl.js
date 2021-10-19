/* eslint-disable complexity -- Necessary for validatePaymentChannelClaim */
import { ValidationError } from '../../errors'

import { BaseTransaction, GlobalFlags, validateBaseTransaction } from './common'

/**
 * Enum representing values for PaymentChannelClaim transaction flags.
 *
 * @category Transaction Flags
 */
export enum PaymentChannelClaimFlags {
  /**
   * Clear the channel's Expiration time. (Expiration is different from the
   * channel's immutable CancelAfter time.) Only the source address of the
   * payment channel can use this flag.
   */
  tfRenew = 0x00010000,
  /**
   * Request to close the channel. Only the channel source and destination
   * addresses can use this flag. This flag closes the channel immediately if it
   * has no more XRP allocated to it after processing the current claim, or if
   * the destination address uses it. If the source address uses this flag when
   * the channel still holds XRP, this schedules the channel to close after
   * SettleDelay seconds have passed. (Specifically, this sets the Expiration of
   * the channel to the close time of the previous ledger plus the channel's
   * SettleDelay time, unless the channel already has an earlier Expiration
   * time.) If the destination address uses this flag when the channel still
   * holds XRP, any XRP that remains after processing the claim is returned to
   * the source address.
   */
  tfClose = 0x00020000,
}

/**
 * Map of flags to boolean values representing {@link PaymentChannelClaim}
 * transaction flags.
 *
 * @category Transaction Flags
 *
 * @example
 * ```typescript
 * const paymentChannelClaim: PaymentChannelClaim = {
 *  Account: 'rMpxZpuy5RBSP47oK2hDWUtk3B5BNQHfGj,
 *  TransactionType: 'PaymentChannelClaim',
 *  Channel: hashes.hashPaymentChannel(
 *    'rMpxZpuy5RBSP47oK2hDWUtk3B5BNQHfGj',
 *    'rQGYqiyH5Ue9J96p4E6Qt6AvqxK4sDhnS5',
 *    21970712,
 *  ),
 *  Amount: '100',
 *  Flags: {
 *    tfClose: true
 *  }
 *}
 *
 * // Autofill the tx to see how flags actually look compared to the interface usage.
 * const autofilledTx = await client.autofill(paymentChannelClaim)
 * console.log(autofilledTx)
 * // {
 * //  Account: 'rMpxZpuy5RBSP47oK2hDWUtk3B5BNQHfGj',
 * //  TransactionType: 'PaymentChannelClaim',
 * //  Channel: 'FC14BF9245D731DC1749EE0F070765E4EB4E993F8ECEE3D00F7E6E26D6EF98CF',
 * //  Amount: '100',
 * //  Flags: 131072,
 * //  Sequence: 21970713,
 * //  Fee: '12',
 * //  LastLedgerSequence: 21970658
 * // }
 * ```
 */
export interface PaymentChannelClaimFlagsInterface extends GlobalFlags {
  /**
   * Clear the channel's Expiration time. (Expiration is different from the
   * channel's immutable CancelAfter time.) Only the source address of the
   * payment channel can use this flag.
   */
  tfRenew?: boolean
  /**
   * Request to close the channel. Only the channel source and destination
   * addresses can use this flag. This flag closes the channel immediately if it
   * has no more XRP allocated to it after processing the current claim, or if
   * the destination address uses it. If the source address uses this flag when
   * the channel still holds XRP, this schedules the channel to close after
   * SettleDelay seconds have passed. (Specifically, this sets the Expiration of
   * the channel to the close time of the previous ledger plus the channel's
   * SettleDelay time, unless the channel already has an earlier Expiration
   * time.) If the destination address uses this flag when the channel still
   * holds XRP, any XRP that remains after processing the claim is returned to
   * the source address.
   */
  tfClose?: boolean
}

/**
 * Claim XRP from a payment channel, adjust the payment channel's expiration,
 * or both.
 *
 * @category Transaction Models
 */
export interface PaymentChannelClaim extends BaseTransaction {
  TransactionType: 'PaymentChannelClaim'
  Flags?: number | PaymentChannelClaimFlagsInterface
  /** The unique ID of the channel as a 64-character hexadecimal string. */
  Channel: string
  /**
   * Total amount of XRP, in drops, delivered by this channel after processing
   * this claim. Required to deliver XRP. Must be more than the total amount
   * delivered by the channel so far, but not greater than the Amount of the
   * signed claim. Must be provided except when closing the channel.
   */
  Balance?: string
  /**
   * The amount of XRP, in drops, authorized by the Signature. This must match
   * the amount in the signed message. This is the cumulative amount of XRP that
   * can be dispensed by the channel, including XRP previously redeemed.
   */
  Amount?: string
  /**
   * The signature of this claim, as hexadecimal. The signed message contains
   * the channel ID and the amount of the claim. Required unless the sender of
   * the transaction is the source address of the channel.
   */
  Signature?: string
  /**
   * The public key used for the signature, as hexadecimal. This must match the
   * PublicKey stored in the ledger for the channel. Required unless the sender
   * of the transaction is the source address of the channel and the Signature
   * field is omitted.
   */
  PublicKey?: string
}

/**
 * Verify the form and type of an PaymentChannelClaim at runtime.
 *
 * @param tx - An PaymentChannelClaim Transaction.
 * @throws When the PaymentChannelClaim is Malformed.
 */
export function validatePaymentChannelClaim(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Channel === undefined) {
    throw new ValidationError('PaymentChannelClaim: missing Channel')
  }

  if (typeof tx.Channel !== 'string') {
    throw new ValidationError('PaymentChannelClaim: Channel must be a string')
  }

  if (tx.Balance !== undefined && typeof tx.Balance !== 'string') {
    throw new ValidationError('PaymentChannelClaim: Balance must be a string')
  }

  if (tx.Amount !== undefined && typeof tx.Amount !== 'string') {
    throw new ValidationError('PaymentChannelClaim: Amount must be a string')
  }

  if (tx.Signature !== undefined && typeof tx.Signature !== 'string') {
    throw new ValidationError('PaymentChannelClaim: Signature must be a string')
  }

  if (tx.PublicKey !== undefined && typeof tx.PublicKey !== 'string') {
    throw new ValidationError('PaymentChannelClaim: PublicKey must be a string')
  }
}
