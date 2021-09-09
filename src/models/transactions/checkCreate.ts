/* eslint-disable complexity -- Necessary for verifyCheckCreate */
import { ValidationError } from '../../common/errors'
import { Amount } from '../common'

import {
  BaseTransaction,
  verifyBaseTransaction,
  isIssuedCurrency,
} from './common'

export interface CheckCreate extends BaseTransaction {
  TransactionType: 'CheckCreate'
  Destination: string
  SendMax: Amount
  DestinationTag?: number
  Expiration?: number
  InvoiceID?: string
}

/**
 * Verify the form and type of an CheckCreate at runtime.
 *
 * @param tx - An CheckCreate Transaction.
 * @throws When the CheckCreate is Malformed.
 */
export function verifyCheckCreate(tx: Record<string, unknown>): void {
  verifyBaseTransaction(tx)

  if (tx.SendMax === undefined) {
    throw new ValidationError('CheckCreate: missing field SendMax')
  }

  if (tx.Destination === undefined) {
    throw new ValidationError('CheckCreate: missing field Destination')
  }

  if (
    typeof tx.SendMax !== 'string' &&
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Only used by JS
    !isIssuedCurrency(tx.SendMax as Record<string, unknown>)
  ) {
    throw new ValidationError('CheckCreate: invalid SendMax')
  }

  if (typeof tx.Destination !== 'string') {
    throw new ValidationError('CheckCreate: invalid Destination')
  }

  if (
    tx.DestinationTag !== undefined &&
    typeof tx.DestinationTag !== 'number'
  ) {
    throw new ValidationError('CheckCreate: invalid DestinationTag')
  }

  if (tx.Expiration !== undefined && typeof tx.Expiration !== 'number') {
    throw new ValidationError('CheckCreate: invalid Expiration')
  }

  if (tx.InvoiceID !== undefined && typeof tx.InvoiceID !== 'string') {
    throw new ValidationError('CheckCreate: invalid InvoiceID')
  }
}
