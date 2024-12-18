import {
  BaseTransaction,
  isString,
  validateBaseTransaction,
  validateCredentialType,
  validateRequiredField,
} from './common'

/**
 * Accepts a credential issued to the Account (i.e. the Account is the Subject of the Credential object).
 * Credentials are represented in hex. Whilst they are allowed a maximum length of 64
 * bytes, every byte requires 2 hex characters for representation.
 * The credential is not considered valid until it has been transferred/accepted.
 *
 * @category Transaction Models
 * */
export interface CredentialAccept extends BaseTransaction {
  TransactionType: 'CredentialAccept'

  /** The subject of the credential. */
  Account: string

  /** The issuer of the credential. */
  Issuer: string

  /** A hex-encoded value to identify the type of credential from the issuer. */
  CredentialType: string
}

/**
 * Verify the form and type of a CredentialAccept at runtime.
 *
 * @param tx - A CredentialAccept Transaction.
 * @throws When the CredentialAccept is Malformed.
 */
export function validateCredentialAccept(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Account', isString)

  validateRequiredField(tx, 'Issuer', isString)

  validateCredentialType(tx)
}
