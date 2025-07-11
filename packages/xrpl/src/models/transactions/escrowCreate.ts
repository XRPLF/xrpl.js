import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'

import {
  Account,
  BaseTransaction,
  isAccount,
  isAmount,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Sequester XRP until the escrow process either finishes or is canceled.
 *
 * @category Transaction Models
 */
export interface EscrowCreate extends BaseTransaction {
  TransactionType: 'EscrowCreate'
  /**
   * The amount to deduct from the sender's balance and and set aside in escrow.
   * Once escrowed, this amount can either go to the Destination address (after any Finish times/conditions)
   * or returned to the sender (after any cancellation times/conditions). Can represent XRP, in drops,
   * an IOU token, or an MPT. Must always be a positive value.
   */
  Amount: Amount | MPTAmount
  /** Address to receive escrowed XRP. */
  Destination: Account
  /**
   * The time, in seconds since the Ripple Epoch, when this escrow expires.
   * This value is immutable; the funds can only be returned the sender after.
   * this time.
   */
  CancelAfter?: number
  /**
   * The time, in seconds since the Ripple Epoch, when the escrowed XRP can be
   * released to the recipient. This value is immutable; the funds cannot move.
   * until this time is reached.
   */
  FinishAfter?: number
  /**
   * Hex value representing a PREIMAGE-SHA-256 crypto-condition . The funds can.
   * only be delivered to the recipient if this condition is fulfilled.
   */
  Condition?: string
  /**
   * Arbitrary tag to further specify the destination for this escrowed.
   * payment, such as a hosted recipient at the destination address.
   */
  DestinationTag?: number
}

/**
 * Verify the form and type of an EscrowCreate at runtime.
 *
 * @param tx - An EscrowCreate Transaction.
 * @throws When the EscrowCreate is Malformed.
 */
export function validateEscrowCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Amount', isAmount)
  validateRequiredField(tx, 'Destination', isAccount)
  validateOptionalField(tx, 'DestinationTag', isNumber)

  if (tx.CancelAfter === undefined && tx.FinishAfter === undefined) {
    throw new ValidationError(
      'EscrowCreate: Either CancelAfter or FinishAfter must be specified',
    )
  }

  if (tx.FinishAfter === undefined && tx.Condition === undefined) {
    throw new ValidationError(
      'EscrowCreate: Either Condition or FinishAfter must be specified',
    )
  }

  if (tx.CancelAfter !== undefined && typeof tx.CancelAfter !== 'number') {
    throw new ValidationError('EscrowCreate: CancelAfter must be a number')
  }

  if (tx.FinishAfter !== undefined && typeof tx.FinishAfter !== 'number') {
    throw new ValidationError('EscrowCreate: FinishAfter must be a number')
  }

  if (tx.Condition !== undefined && typeof tx.Condition !== 'string') {
    throw new ValidationError('EscrowCreate: Condition must be a string')
  }
}
