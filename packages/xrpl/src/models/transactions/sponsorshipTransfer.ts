import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateOptionalField,
} from './common'

/**
 * A SponsorshipTransfer transaction transfers the sponsorship
 * of an account or object.
 *
 * @category Transaction Models
 */
export interface SponsorshipTransfer extends BaseTransaction {
  TransactionType: 'SponsorshipTransfer'
  ObjectID: string
}

/**
 * Verify the form and type of a SponsorshipTransfer at runtime.
 *
 * @param tx - A SponsorshipTransfer Transaction.
 * @throws When the SponsorshipTransfer is malformed.
 */
export function validateSponsorshipTransfer(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'ObjectID', isString)
  if (tx.ObjectID !== undefined) {
    // @typescript-eslint/no-magic-numbers - objectID length is 64
    if (tx.ObjectID.length !== 64) {
      throw new ValidationError(
        'SponsorshipTransfer: ObjectID must be a valid ObjectID',
      )
    }
  }
}
