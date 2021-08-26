import {ValidationError} from '../../common/errors'
import {
  BaseTransaction,
  GlobalFlagsInterface,
  verifyBaseTransaction
} from './common'

export enum PaymentChannelClaimFlags {
  tfRenew = 0x00010000,
  tfClose = 0x00020000
}

export interface PaymentChannelClaimFlagsInterface
  extends GlobalFlagsInterface {
  tfRenew?: boolean
  tfClose?: boolean
}

export interface PaymentChannelClaim extends BaseTransaction {
  TransactionType: 'PaymentChannelClaim'
  Flags?: number | PaymentChannelClaimFlagsInterface
  Channel: string
  Balance?: string
  Amount?: string
  Signature?: string
  PublicKey?: string
}

/**
 * Verify the form and type of an PaymentChannelClaim at runtime.
 *
 * @param tx - An PaymentChannelClaim Transaction
 * @returns - Void.
 * @throws - When the PaymentChannelClaim is Malformed.
 */
export function verifyPaymentChannelClaim(tx: PaymentChannelClaim): void {
  verifyBaseTransaction(tx)

  if (tx.Channel === undefined)
    throw new ValidationError('PaymentChannelClaim: missing Channel')

  if (typeof tx.Channel !== 'string')
    throw new ValidationError('PaymentChannelClaim: Channel must be a string')

  if (tx.Balance !== undefined && typeof tx.Balance !== 'string')
    throw new ValidationError('PaymentChannelClaim: Balance must be a string')

  if (tx.Amount !== undefined && typeof tx.Amount !== 'string')
    throw new ValidationError('PaymentChannelClaim: Amount must be a string')

  if (tx.Signature !== undefined && typeof tx.Signature !== 'string')
    throw new ValidationError('PaymentChannelClaim: Signature must be a string')

  if (tx.PublicKey !== undefined && typeof tx.PublicKey !== 'string')
    throw new ValidationError('PaymentChannelClaim: PublicKey must be a string')
}
