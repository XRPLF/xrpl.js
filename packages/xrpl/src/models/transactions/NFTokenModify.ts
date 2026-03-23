import { ValidationError } from '../../errors'
import { isHex } from '../utils'

import {
  BaseTransaction,
  validateBaseTransaction,
  isAccount,
  isString,
  validateOptionalField,
  Account,
  validateRequiredField,
} from './common'

/**
 * The NFTokenModify transaction modifies an NFToken's URI
 * if its tfMutable is set to true.
 */
export interface NFTokenModify extends BaseTransaction {
  TransactionType: 'NFTokenModify'
  /**
   * Identifies the NFTokenID of the NFToken object that the
   * offer references.
   */
  NFTokenID: string
  /**
   * Indicates the AccountID of the account that owns the corresponding NFToken.
   * Can be omitted if the owner is the account submitting this transaction
   */
  Owner?: Account
  /**
   * URI that points to the data and/or metadata associated with the NFT.
   * This field need not be an HTTP or HTTPS URL; it could be an IPFS URI, a
   * magnet link, immediate data encoded as an RFC2379 "data" URL, or even an
   * opaque issuer-specific encoding. The URI is NOT checked for validity, but
   * the field is limited to a maximum length of 256 bytes.
   *
   * This field must be hex-encoded. You can use `convertStringToHex` to
   * convert this field to the proper encoding.
   *
   * This field must not be an empty string. Omit it from the transaction or
   * set to `null` if you do not use it.
   */
  URI?: string | null
}

/**
 * Verify the form and type of an NFTokenModify at runtime.
 *
 * @param tx - An NFTokenModify Transaction.
 * @throws When the NFTokenModify is Malformed.
 */
export function validateNFTokenModify(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'NFTokenID', isString)
  validateOptionalField(tx, 'Owner', isAccount)
  validateOptionalField(tx, 'URI', isString)

  if (tx.URI !== undefined && typeof tx.URI === 'string') {
    if (tx.URI === '') {
      throw new ValidationError('NFTokenModify: URI must not be empty string')
    }
    if (!isHex(tx.URI)) {
      throw new ValidationError('NFTokenModify: URI must be in hex format')
    }
  }
}
