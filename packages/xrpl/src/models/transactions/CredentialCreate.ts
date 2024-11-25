import { HEX_REGEX } from '@xrplf/isomorphic/dist/utils'

import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  validateBaseTransaction,
  validateCredentialType,
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

  /** A (hex-encoded) value to identify the type of credential from the issuer. */
  CredentialType: string

  /** Optional credential expiration. */
  Expiration?: number

  /** Optional additional data about the credential (such as a link to the VC document). */
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

  if (tx.Account == null) {
    throw new ValidationError('CredentialCreate: missing field Account')
  }

  if (typeof tx.Account !== 'string') {
    throw new ValidationError('CredentialCreate: Account must be a string')
  }

  if (tx.Subject == null) {
    throw new ValidationError('CredentialCreate: missing field Subject')
  }

  if (typeof tx.Subject !== 'string') {
    throw new ValidationError('CredentialCreate: Subject must be a string')
  }

  if (tx.expiration && typeof tx.expiration !== 'number') {
    throw new ValidationError('CredentialCreate: Expiration must be a number')
  }

  validateURI(tx.URI)

  validateCredentialType(tx)
}

function validateURI(uri: unknown): void {
  if (uri === undefined) {
    return
  }

  if (typeof uri !== 'string') {
    throw new ValidationError('CredentialCreate: URI must be a string')
  }

  if (uri.length === 0) {
    throw new ValidationError('CredentialCreate: URI length must be > 0')
  } else if (uri.length > MAX_URI_LENGTH) {
    throw new ValidationError(
      `CredentialCreate: URI length must be <= ${MAX_URI_LENGTH}`,
    )
  }

  if (!HEX_REGEX.test(uri)) {
    throw new ValidationError('CredentialCreate: URI must be encoded in hex')
  }
}
