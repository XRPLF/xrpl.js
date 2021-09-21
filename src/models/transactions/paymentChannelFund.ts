import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

export interface PaymentChannelFund extends BaseTransaction {
  TransactionType: 'PaymentChannelFund'
  Channel: string
  Amount: string
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

  if (typeof tx.Amount !== 'string') {
    throw new ValidationError('PaymentChannelFund: Amount must be a string')
  }

  if (tx.Expiration !== undefined && typeof tx.Expiration !== 'number') {
    throw new ValidationError('PaymentChannelFund: Expiration must be a number')
  }
}
