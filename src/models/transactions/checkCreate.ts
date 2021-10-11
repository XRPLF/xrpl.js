/* eslint-disable complexity -- Necessary for validateCheckCreate */
import { ValidationError } from '../../errors'
import { Amount } from '../common'

import {
  BaseTransaction,
  validateBaseTransaction,
  isIssuedCurrency,
} from './common'

/**
 * Create a Check object in the ledger, which is a deferred payment that can be
 * cashed by its intended destination. The sender of this transaction is the
 * sender of the Check.
 *
 * @category Transaction Models
 */
export interface CheckCreate extends BaseTransaction {
  TransactionType: 'CheckCreate'
  /** The unique address of the account that can cash the Check. */
  Destination: string
  /**
   * Maximum amount of source currency the Check is allowed to debit the
   * sender, including transfer fees on non-XRP currencies. The Check can only
   * credit the destination with the same currency (from the same issuer, for
   * non-XRP currencies). For non-XRP amounts, the nested field names MUST be.
   * lower-case.
   */
  SendMax: Amount
  /**
   * Arbitrary tag that identifies the reason for the Check, or a hosted.
   * recipient to pay.
   */
  DestinationTag?: number
  /**
   * Time after which the Check is no longer valid, in seconds since the Ripple.
   * Epoch.
   */
  Expiration?: number
  /**
   * Arbitrary 256-bit hash representing a specific reason or identifier for.
   * this Check.
   */
  InvoiceID?: string
}

/**
 * Verify the form and type of an CheckCreate at runtime.
 *
 * @param tx - An CheckCreate Transaction.
 * @throws When the CheckCreate is Malformed.
 */
export function validateCheckCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

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
