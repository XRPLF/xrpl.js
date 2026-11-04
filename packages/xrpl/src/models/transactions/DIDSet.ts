import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isHexString,
  validateBaseTransaction,
  validateOptionalField,
} from './common'

/**
 * Creates a new DID ledger entry or updates the fields of an existing one.
 *
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

  validateOptionalField(tx, 'Data', isHexString)

  validateOptionalField(tx, 'DIDDocument', isHexString)

  validateOptionalField(tx, 'URI', isHexString)

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
