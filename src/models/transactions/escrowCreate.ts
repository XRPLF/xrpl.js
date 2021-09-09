/* eslint-disable complexity -- Necessary for verifyEscrowCreate */
import { ValidationError } from '../../common/errors'

import { BaseTransaction, verifyBaseTransaction } from './common'

export interface EscrowCreate extends BaseTransaction {
  TransactionType: 'EscrowCreate'
  Amount: string
  Destination: string
  CancelAfter?: number
  FinishAfter?: number
  Condition?: string
  DestinationTag?: number
}

/**
 * Verify the form and type of an EscrowCreate at runtime.
 *
 * @param tx - An EscrowCreate Transaction.
 * @throws When the EscrowCreate is Malformed.
 */
export function verifyEscrowCreate(tx: Record<string, unknown>): void {
  verifyBaseTransaction(tx)

  if (tx.Amount === undefined) {
    throw new ValidationError('EscrowCreate: missing field Amount')
  }

  if (typeof tx.Amount !== 'string') {
    throw new ValidationError('EscrowCreate: Amount must be a string')
  }

  if (tx.Destination === undefined) {
    throw new ValidationError('EscrowCreate: missing field Destination')
  }

  if (typeof tx.Destination !== 'string') {
    throw new ValidationError('EscrowCreate: Destination must be a string')
  }

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

  if (
    tx.DestinationTag !== undefined &&
    typeof tx.DestinationTag !== 'number'
  ) {
    throw new ValidationError('EscrowCreate: DestinationTag must be a number')
  }
}
