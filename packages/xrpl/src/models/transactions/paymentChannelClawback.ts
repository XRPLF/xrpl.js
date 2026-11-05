import { IssuedCurrencyAmount, MPTAmount } from '../common'

import {
  BaseTransaction,
  isClawbackAmount,
  isLedgerEntryId,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'
import {
  validatePayChanAmount,
  validatePayChanIssuedCurrency,
} from './paymentChannelCreate'

/**
 * (TokenPaychan) The PaymentChannelClawback transaction lets the issuer of the
 * IOU or MPT locked in a payment channel claw back the channel's unclaimed
 * remainder. The amount the destination has already been paid (the channel's
 * Balance) is not touched. A full clawback closes the channel.
 *
 * @category Transaction Models
 */
export interface PaymentChannelClawback extends BaseTransaction {
  TransactionType: 'PaymentChannelClawback'

  /**
   * The unique ID of the channel as a 64-character hexadecimal string.
   */
  Channel: string

  /**
   * The amount to claw back, in the channel's asset. For an IOU the `issuer` is
   * the token issuer, which must be the transaction's Account. If omitted, or if
   * it is at least the channel's unclaimed remainder, the whole remainder is
   * clawed back and the channel closes. Must be greater than 0.
   */
  Amount?: IssuedCurrencyAmount | MPTAmount
}

/**
 * Verify the form and type of a PaymentChannelClawback at runtime.
 *
 * @param tx - A PaymentChannelClawback Transaction.
 * @throws When the PaymentChannelClawback is malformed.
 */
export function validatePaymentChannelClawback(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Channel', isLedgerEntryId)
  validateOptionalField(tx, 'Amount', isClawbackAmount)

  if (tx.Amount !== undefined) {
    validatePayChanAmount(tx, 'Amount')
    validatePayChanIssuedCurrency(tx, 'Amount')
  }
}
