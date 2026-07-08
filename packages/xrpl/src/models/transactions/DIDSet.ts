import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateOptionalField,
} from './common'

// TODO: add docs

/**
 * @category Transaction Models
 */
export interface DIDSet extends BaseTransaction {
  TransactionType: 'DIDSet'

  Data?: string

  DIDDocument?: string

  URI?: string
}

/**
 * Verify the form and type of a DIDSet at runtime.
 *
 * @param tx - A DIDSet Transaction.
 * @throws When the DIDSet is malformed.
 */
export function validateDIDSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'Data', isString, { expectedType: 'a string' })

  validateOptionalField(tx, 'DIDDocument', isString, {
    expectedType: 'a string',
  })

  validateOptionalField(tx, 'URI', isString, { expectedType: 'a string' })

  if (
    tx.Data === undefined &&
    tx.DIDDocument === undefined &&
    tx.URI === undefined
  ) {
    throw new ValidationError(
      'DIDSet: Must have at least one of `Data`, `DIDDocument`, and `URI`',
    )
  }
}
