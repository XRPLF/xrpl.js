import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

import {Credential} from '../ledger/PermissionedDomain'

const ACCEPTED_CREDENTIALS_MAX_LENGTH = 10

export interface PermissionedDomainSet extends BaseTransaction {
  TransactionType: 'PermissionedDomainSet'

  DomainID?: string
  AcceptedCredentials: Credential[]
}

// eslint-disable-next-line max-lines-per-function -- necessary to validate many fields
export function validatePermissionedDomainSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'DomainID', isString)

  // eslint-disable-next-line max-lines-per-function -- necessary to validate many fields
  validateRequiredField(tx, 'AcceptedCredentials', (value) => {
    if (!Array.isArray(value)) {
      throw new ValidationError('PermissionedDomainSet: AcceptedCredentials must be an array')
    }

    if (value.length > ACCEPTED_CREDENTIALS_MAX_LENGTH) {
      throw new ValidationError(
        `PermissionedDomainSet: AcceptedCredentials must have at most ${ACCEPTED_CREDENTIALS_MAX_LENGTH} Credential objects`,
      )
    }
    else if (value.length == 0) {
      throw new ValidationError(
        `PermissionedDomainSet: AcceptedCredentials must have at least one Credential object`,
      )
    }

    // Note: This implementation does not rigorously validate the inner-object format of AcceptedCredentials array because that would be a blatant repetition of the rippled cpp implementation.

    return true
  })
}
