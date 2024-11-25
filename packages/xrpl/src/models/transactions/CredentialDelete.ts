import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateCredentialType,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * Deletes a Credential object.
 *
 * @category Transaction Models
 * */
export interface CredentialDelete extends BaseTransaction {
  TransactionType: 'CredentialDelete'

  /** The transaction submitter. */
  Account: string

  /** The person that the credential is for. If omitted, Account is assumed to be the subject. */
  Subject?: string

  /** The issuer of the credential. If omitted, Account is assumed to be the issuer. */
  Issuer?: string

  /** A (hex-encoded) value to identify the type of credential from the issuer. */
  CredentialType: string
}

/**
 * Verify the form and type of a CredentialDelete at runtime.
 *
 * @param tx - A CredentialDelete Transaction.
 * @throws When the CredentialDelete is Malformed.
 */
export function validateCredentialDelete(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (!tx.Account && !tx.Issuer) {
    throw new ValidationError(
      'CredentialDelete: Neither `issuer` nor `subject` was provided',
    )
  }

  validateRequiredField(tx, 'Account', isString)

  validateOptionalField(tx, 'Subject', isString)

  validateOptionalField(tx, 'Issuer', isString)

  validateCredentialType(tx)
}
