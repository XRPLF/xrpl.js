import { AuthorizeCredential } from '../common'

import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
  validateCredentialsList,
} from './common'

const MAX_ACCEPTED_CREDENTIALS = 10

export interface PermissionedDomainSet extends BaseTransaction {
  /* The transaction type (PermissionedDomainSet). */
  TransactionType: 'PermissionedDomainSet'

  /* The domain to modify. Must be included if modifying an existing domain. */
  DomainID?: string

  /* The credentials that are accepted by the domain. Ownership of one
  of these credentials automatically makes you a member of the domain.
  An empty array means deleting the field. */
  AcceptedCredentials: AuthorizeCredential[]
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
  validateRequiredField(
    tx,
    'AcceptedCredentials',
    () => tx.AcceptedCredentials instanceof Array,
  )

  validateCredentialsList(
    tx.AcceptedCredentials,
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- known from base check
    tx.TransactionType as string,
    // PermissionedDomainSet uses AuthorizeCredential nested objects only, strings are not allowed
    false,
    // PermissionedDomainSet uses at most 10 accepted credentials. This is different from Credential-feature transactions.
    MAX_ACCEPTED_CREDENTIALS,
  )
}
