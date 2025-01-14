import { ValidationError } from '../../errors'
import { Credential } from '../ledger/PermissionedDomain'

import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
  isAuthorizeCredential,
  containsDuplicates,
} from './common'

const ACCEPTED_CREDENTIALS_MAX_LENGTH = 10

export interface PermissionedDomainSet extends BaseTransaction {
  TransactionType: 'PermissionedDomainSet'

  DomainID?: string
  AcceptedCredentials: Credential[]
}

/**
 * Validate a PermissionedDomainSet transaction.
 *
 * @param tx - The transaction to validate.
 * @throws {ValidationError} When the transaction is invalid.
 */
export function validatePermissionedDomainSet(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'DomainID', isString)

  validateRequiredField(tx, 'AcceptedCredentials', (value) => {
    if (!Array.isArray(value)) {
      throw new ValidationError(
        'PermissionedDomainSet: AcceptedCredentials must be an array',
      )
    }

    if (value.length > ACCEPTED_CREDENTIALS_MAX_LENGTH) {
      throw new ValidationError(
        `PermissionedDomainSet: AcceptedCredentials must have at most ${ACCEPTED_CREDENTIALS_MAX_LENGTH} Credential objects`,
      )
    } else if (value.length === 0) {
      throw new ValidationError(
        `PermissionedDomainSet: AcceptedCredentials must have at least one Credential object`,
      )
    }

    value.forEach((credential) => {
      if (!isAuthorizeCredential(credential)) {
        throw new ValidationError(
          'PermissionedDomainSet: Invalid AcceptedCredentials format',
        )
      }
    })

    if (containsDuplicates(value)) {
      throw new ValidationError(
        `PermissionedDomainSet: AcceptedCredentials cannot contain duplicate elements`,
      )
    }

    return true
  })
}
