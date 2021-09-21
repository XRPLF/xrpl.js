/* eslint-disable complexity -- Necessary for validatePaymentChannelCreate */
import { ValidationError } from '../../errors'

import { BaseTransaction, validateBaseTransaction } from './common'

export interface PaymentChannelCreate extends BaseTransaction {
  TransactionType: 'PaymentChannelCreate'
  Amount: string
  Destination: string
  SettleDelay: number
  PublicKey: string
  CancelAfter?: number
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

  if (tx.Amount === undefined) {
    throw new ValidationError('PaymentChannelCreate: missing Amount')
  }

  if (typeof tx.Amount !== 'string') {
    throw new ValidationError('PaymentChannelCreate: Amount must be a string')
  }

  if (tx.Destination === undefined) {
    throw new ValidationError('PaymentChannelCreate: missing Destination')
  }

  if (typeof tx.Destination !== 'string') {
    throw new ValidationError(
      'PaymentChannelCreate: Destination must be a string',
    )
  }

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

  if (
    tx.DestinationTag !== undefined &&
    typeof tx.DestinationTag !== 'number'
  ) {
    throw new ValidationError(
      'PaymentChannelCreate: DestinationTag must be a number',
    )
  }
}
