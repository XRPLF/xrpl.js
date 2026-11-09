import { ValidationError } from '../../errors'
import { Amount } from '../common'
import { hasFlag, isHex } from '../utils'

import {
  Account,
  BaseTransaction,
  GlobalFlagsInterface,
  isAccount,
  isAmount,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'
import type { TransactionMetadataBase } from './metadata'
import { MAX_TRANSFER_FEE } from './MPTokenIssuanceCreate'

/**
 * Transaction Flags for an NFTokenMint Transaction.
 *
 * @category Transaction Flags
 */
export enum NFTokenMintFlags {
  /**
   * If set, indicates that the minted token may be burned by the issuer even
   * if the issuer does not currently hold the token. The current holder of
   * the token may always burn it.
   */
  tfBurnable = 0x00000001,
  /**
   * If set, indicates that the token may only be offered or sold for XRP.
   */
  tfOnlyXRP = 0x00000002,
  /**
   * If set, indicates that the issuer wants a trustline to be automatically
   * created.
   */
  tfTrustLine = 0x00000004,
  /**
   * If set, indicates that this NFT can be transferred. This flag has no
   * effect if the token is being transferred from the issuer or to the
   * issuer.
   */
  tfTransferable = 0x00000008,
  /**
   * If set, indicates that this NFT's URI can be modified.
   */
  tfMutable = 0x00000010,
}

/**
 * Map of flags to boolean values representing {@link NFTokenMint} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface NFTokenMintFlagsInterface extends GlobalFlagsInterface {
  tfBurnable?: boolean
  tfOnlyXRP?: boolean
  tfTrustLine?: boolean
  tfTransferable?: boolean
  tfMutable?: boolean
}

/**
 * The NFTokenMint transaction creates an NFToken object and adds it to the
 * relevant NFTokenPage object of the minter. If the transaction is
 * successful, the newly minted token will be owned by the minter account
 * specified by the transaction.
 */
export interface NFTokenMint extends BaseTransaction {
  TransactionType: 'NFTokenMint'
  /**
   * Indicates the taxon associated with this token. The taxon is generally a
   * value chosen by the minter of the token and a given taxon may be used for
   * multiple tokens. The implementation reserves taxon identifiers greater
   * than or equal to 2147483648 (0x80000000). If you have no use for this
   * field, set it to 0.
   */
  NFTokenTaxon: number
  /**
   * Indicates the account that should be the issuer of this token. This value
   * is optional and should only be specified if the account executing the
   * transaction is not the `Issuer` of the `NFToken` object. If it is
   * present, the `MintAccount` field in the `AccountRoot` of the `Issuer`
   * field must match the `Account`, otherwise the transaction will fail.
   */
  Issuer?: Account
  /**
   * Specifies the fee charged by the issuer for secondary sales of the Token,
   * if such sales are allowed. Valid values for this field are between 0 and
   * 50000 inclusive, allowing transfer rates between 0.000% and 50.000% in
   * increments of 0.001%. A non-zero value requires the `tfTransferable`
   * flag to be set.
   */
  TransferFee?: number
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
   * set to `undefined` value if you do not use it.
   */
  URI?: string | null
  /**
   * Indicates the amount expected for the Token.
   *
   * The amount can be zero. This would indicate that the account is giving
   * the token away free, either to anyone at all, or to the account identified
   * by the Destination field.
   */
  Amount?: Amount
  /**
   * Indicates the time after which the offer will no longer
   * be valid. The value is the number of seconds since the
   * Ripple Epoch.
   */
  Expiration?: number
  /**
   * If present, indicates that this offer may only be
   * accepted by the specified account. Attempts by other
   * accounts to accept this offer MUST fail.
   */
  Destination?: Account
  Flags?: number | NFTokenMintFlagsInterface
}

export interface NFTokenMintMetadata extends TransactionMetadataBase {
  // rippled 1.11.0 or later
  nftoken_id?: string
  // if Amount is present
  offer_id?: string
}

/**
 * Verify the TransferFee of an NFTokenMint at runtime.
 *
 * @param tx - An NFTokenMint Transaction.
 * @throws When the TransferFee is malformed or set without the tfTransferable flag.
 */
function validateTransferFee(tx: Record<string, unknown>): void {
  validateOptionalField(tx, 'TransferFee', isNumber)

  if (typeof tx.TransferFee !== 'number') {
    return
  }

  if (
    !Number.isInteger(tx.TransferFee) ||
    tx.TransferFee < 0 ||
    tx.TransferFee > MAX_TRANSFER_FEE
  ) {
    throw new ValidationError(
      `NFTokenMint: TransferFee must be an integer between 0 and ${MAX_TRANSFER_FEE}`,
    )
  }

  if (
    tx.TransferFee > 0 &&
    !hasFlag(tx, NFTokenMintFlags.tfTransferable, 'tfTransferable')
  ) {
    throw new ValidationError(
      'NFTokenMint: TransferFee cannot be provided without enabling tfTransferable flag',
    )
  }
}

/**
 * Verify the form and type of an NFTokenMint at runtime.
 *
 * @param tx - An NFTokenMint Transaction.
 * @throws When the NFTokenMint is Malformed.
 */
export function validateNFTokenMint(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  if (tx.Account === tx.Issuer) {
    throw new ValidationError(
      'NFTokenMint: Issuer must not be equal to Account',
    )
  }

  validateOptionalField(tx, 'Issuer', isAccount)

  if (typeof tx.URI === 'string' && tx.URI === '') {
    throw new ValidationError('NFTokenMint: URI must not be empty string')
  }

  if (typeof tx.URI === 'string' && !isHex(tx.URI)) {
    throw new ValidationError('NFTokenMint: URI must be in hex format')
  }

  validateRequiredField(tx, 'NFTokenTaxon', isNumber)

  validateTransferFee(tx)

  if (tx.Amount == null) {
    if (tx.Expiration != null || tx.Destination != null) {
      throw new ValidationError(
        'NFTokenMint: Amount is required when Expiration or Destination is present',
      )
    }
  }

  validateOptionalField(tx, 'Amount', isAmount)
  validateOptionalField(tx, 'Expiration', isNumber)
  validateOptionalField(tx, 'Destination', isAccount)
}
