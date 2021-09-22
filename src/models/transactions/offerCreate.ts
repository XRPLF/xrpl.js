/* eslint-disable complexity -- Necessary for validateOfferCreate */
import { ValidationError } from '../../errors'
import { Amount } from '../common'

import {
  BaseTransaction,
  GlobalFlags,
  validateBaseTransaction,
  isAmount,
} from './common'

export enum OfferCreateTransactionFlags {
  tfPassive = 0x00010000,
  tfImmediateOrCancel = 0x00020000,
  tfFillOrKill = 0x00040000,
  tfSell = 0x00080000,
}

export interface OfferCreateFlagsInterface extends GlobalFlags {
  tfPassive?: boolean
  tfImmediateOrCancel?: boolean
  tfFillOrKill?: boolean
  tfSell?: boolean
}

export interface OfferCreate extends BaseTransaction {
  TransactionType: 'OfferCreate'
  Flags?: number | OfferCreateFlagsInterface
  Expiration?: number
  OfferSequence?: number
  TakerGets: Amount
  TakerPays: Amount
}

/**
 * Verify the form and type of an OfferCreate at runtime.
 *
 * @param tx - An OfferCreate Transaction.
 * @throws When the OfferCreate is Malformed.
 */
export function validateOfferCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.TakerGets === undefined) {
    throw new ValidationError('OfferCreate: missing field TakerGets')
  }

  if (tx.TakerPays === undefined) {
    throw new ValidationError('OfferCreate: missing field TakerPays')
  }

  if (typeof tx.TakerGets !== 'string' && !isAmount(tx.TakerGets)) {
    throw new ValidationError('OfferCreate: invalid TakerGets')
  }

  if (typeof tx.TakerPays !== 'string' && !isAmount(tx.TakerPays)) {
    throw new ValidationError('OfferCreate: invalid TakerPays')
  }

  if (tx.Expiration !== undefined && typeof tx.Expiration !== 'number') {
    throw new ValidationError('OfferCreate: invalid Expiration')
  }

  if (tx.OfferSequence !== undefined && typeof tx.OfferSequence !== 'number') {
    throw new ValidationError('OfferCreate: invalid OfferSequence')
  }
}
