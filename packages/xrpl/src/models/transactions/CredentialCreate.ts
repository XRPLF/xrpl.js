import { HEX_REGEX } from '@xrplf/isomorphic/dist/utils'

import { BaseTransaction } from '../../../dist/npm'
import { ValidationError } from '../../errors'

import { validateBaseTransaction, validateCredentialType } from './common'

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

  validateURI(tx.URI)

  validateCredentialType(tx.CredentialType)
}

function validateURI(uri: string | undefined): void {
  if (!uri) {
    return
  }

  if (uri.length === 0) {
    throw new ValidationError('CredentialCreate: URI length must be > 0')
  } else if (uri.length > MAX_URI_LENGTH) {
    throw new ValidationError(
      `CredentialCreate: URI length must be <= ${MAX_URI_LENGTH}`,
    )
  }

  if (!HEX_REGEX.test(uri)) {
    throw new ValidationError('CredentialCreate: URI must be hex encoded')
  }
}
