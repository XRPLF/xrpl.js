import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isAccount,
  isHexString,
  isNumber,
  validateBaseTransaction,
  validateCredentialType,
  validateOptionalField,
  validateRequiredField,
} from './common'

const MAX_URI_LENGTH = 256

/**
 * Creates a Credential object. It must be sent by the issuer.
 *
 * @category Transaction Models
 * */
export interface CredentialCreate extends BaseTransaction {
  TransactionType: 'CredentialCreate'

  /** The issuer of the credential. */
  Account: string

  /** The subject of the credential. */
  Subject: string

  /** A hex-encoded value to identify the type of credential from the issuer. */
  CredentialType: string

  /** Credential expiration. */
  Expiration?: number

  /** Additional data about the credential (such as a link to the VC document). */
  URI?: string
}

/**
 * Verify the form and type of a CredentialCreate at runtime.
 *
 * @param tx - A CredentialCreate Transaction.
 * @throws When the CredentialCreate is Malformed.
 */
export function validateCredentialCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'Account', isAccount)

  validateRequiredField(tx, 'Subject', isAccount)

  validateCredentialType(tx)

  validateOptionalField(tx, 'Expiration', isNumber)

  validateOptionalField(tx, 'URI', isHexString)

  const uriLength = tx.URI?.length
  if (uriLength !== undefined) {
    if (uriLength === 0) {
      throw new ValidationError(
        'CredentialCreate: URI cannot be an empty string',
      )
    }
    if (uriLength > MAX_URI_LENGTH) {
      throw new ValidationError(
        `CredentialCreate: URI length must be <= ${MAX_URI_LENGTH}`,
      )
    }
  }
}
