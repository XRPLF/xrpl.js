import { ValidationError } from '../../errors'
import { isHex } from '../utils'

import { BaseTransaction, GlobalFlags, validateBaseTransaction } from './common'

/**
 * Transaction Flags for an URITokenMint Transaction.
 *
 * @category Transaction Flags
 */
export enum URITokenMintFlags {
  /**
   * If set, indicates that the minted token may be burned by the issuer even
   * if the issuer does not currently hold the token. The current holder of
   * the token may always burn it.
   */
  tfBurnable = 0x00000001,
}

/**
 * Map of flags to boolean values representing {@link URITokenMint} transaction
 * flags.
 *
 * @category Transaction Flags
 *
 * @example
 * ```typescript
 * const tx: URITokenMint = {
 * Account: 'rhFcpWDHLqpBmX4ezWiA5VLSS4e1BHqhHd',
 * URI: '697066733A2F2F434944',
 * TransactionType: 'URITokenMint',
 * Flags: {
 *   tfBurnable: true,
 *  },
 * }
 *
 * // Autofill the tx to see how flags actually look compared to the interface usage.
 * const autofilledTx = await client.autofill(tx)
 * console.log(autofilledTx)
 * // {
 * // Account: 'rhFcpWDHLqpBmX4ezWiA5VLSS4e1BHqhHd',
 * // URI: '697066733A2F2F434944',
 * // TransactionType: 'URITokenMint',
 * // Flags: 0,
 * // Sequence: 21970384,
 * // Fee: '12',
 * // LastLedgerSequence: 21970404
 * // }
 * ```
 */
export interface URITokenMintFlagsInterface extends GlobalFlags {
  tfBurnable?: boolean
}

/**
 * An URITokenMint transaction is effectively a limit order . It defines an
 * intent to exchange currencies, and creates an Offer object if not completely.
 * Fulfilled when placed. Offers can be partially fulfilled.
 *
 * @category Transaction Models
 */
export interface URITokenMint extends BaseTransaction {
  TransactionType: 'URITokenMint'
  Flags?: number | URITokenMintFlagsInterface
  /**
   * URI that points to the data and/or metadata associated with the NFT.
   * This field need not be an HTTP or HTTPS URL; it could be an IPFS URI, a
   * magnet link, immediate data encoded as an RFC2379 "data" URL, or even an
   * opaque issuer-specific encoding. The URI is NOT checked for validity, but
   * the field is limited to a maximum length of 256 bytes.
   *
   * This field must be hex-encoded. You can use `convertStringToHex` to
   * convert this field to the proper encoding.
   */
  URI: string

  Digest?: string
}

/**
 * Verify the form and type of an URITokenMint at runtime.
 *
 * @param tx - An URITokenMint Transaction.
 * @throws When the URITokenMint is Malformed.
 */
export function validateURITokenMint(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (typeof tx.URI === 'string' && !isHex(tx.URI)) {
    throw new ValidationError('URITokenMint: URI must be in hex format')
  }
}
