/* eslint-disable max-lines -- required here due to extensive type checks */
import { hexToString } from '@xrplf/isomorphic/utils'

import { ValidationError } from '../../errors'
import { isHex, INTEGER_SANITY_CHECK, isFlagEnabled } from '../utils'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  validateBaseTransaction,
  validateOptionalField,
  isString,
  isNumber,
} from './common'
import type { TransactionMetadataBase } from './metadata'

// 2^63 - 1
const MAX_AMT = '9223372036854775807'
const MAX_TRANSFER_FEE = 50000
const TICKER_REGEX = /^[A-Z0-9]{1,6}$/u

const MPT_META_REQUIRED_FIELDS = [
  'ticker',
  'name',
  'icon',
  'asset_class',
  'issuer_name',
]

const MPT_META_ASSET_CLASSES = [
  'rwa',
  'memes',
  'wrapped',
  'gaming',
  'defi',
  'other',
]

const MPT_META_ASSET_SUB_CLASSES = [
  'stablecoin',
  'commodity',
  'real_estate',
  'private_credit',
  'equity',
  'treasury',
  'other',
]

/**
 * Transaction Flags for an MPTokenIssuanceCreate Transaction.
 *
 * @category Transaction Flags
 */
export enum MPTokenIssuanceCreateFlags {
  /**
   * If set, indicates that the MPT can be locked both individually and globally.
   * If not set, the MPT cannot be locked in any way.
   */
  tfMPTCanLock = 0x00000002,
  /**
   * If set, indicates that individual holders must be authorized.
   * This enables issuers to limit who can hold their assets.
   */
  tfMPTRequireAuth = 0x00000004,
  /**
   * If set, indicates that individual holders can place their balances into an escrow.
   */
  tfMPTCanEscrow = 0x00000008,
  /**
   * If set, indicates that individual holders can trade their balances
   *  using the XRP Ledger DEX or AMM.
   */
  tfMPTCanTrade = 0x00000010,
  /**
   * If set, indicates that tokens may be transferred to other accounts
   *  that are not the issuer.
   */
  tfMPTCanTransfer = 0x00000020,
  /**
   * If set, indicates that the issuer may use the Clawback transaction
   * to clawback value from individual holders.
   */
  tfMPTCanClawback = 0x00000040,
}

/**
 * Map of flags to boolean values representing {@link MPTokenIssuanceCreate} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface MPTokenIssuanceCreateFlagsInterface
  extends GlobalFlagsInterface {
  tfMPTCanLock?: boolean
  tfMPTRequireAuth?: boolean
  tfMPTCanEscrow?: boolean
  tfMPTCanTrade?: boolean
  tfMPTCanTransfer?: boolean
  tfMPTCanClawback?: boolean
}

/**
 * MPTokenMetadata object as per the XLS-89d standard.
 */
export interface MPTokenMetadata {
  ticker: string
  name: string
  desc: string
  icon: string
  asset_class: string
  asset_subclass?: string
  issuer_name: string
  urls?: MPTokenMetadataUrl[]
  additional_info?: string
}

/**
 * MPTokenMetadataUrl object as per the XLS-89d standard.
 */
export interface MPTokenMetadataUrl {
  url: string
  type: string
  title: string
}

/**
 * The MPTokenIssuanceCreate transaction creates a MPTokenIssuance object
 * and adds it to the relevant directory node of the creator account.
 * This transaction is the only opportunity an issuer has to specify any token fields
 * that are defined as immutable (e.g., MPT Flags). If the transaction is successful,
 * the newly created token will be owned by the account (the creator account) which
 * executed the transaction.
 */
export interface MPTokenIssuanceCreate extends BaseTransaction {
  TransactionType: 'MPTokenIssuanceCreate'
  /**
   * An asset scale is the difference, in orders of magnitude, between a standard unit and
   * a corresponding fractional unit. More formally, the asset scale is a non-negative integer
   * (0, 1, 2, …) such that one standard unit equals 10^(-scale) of a corresponding
   * fractional unit. If the fractional unit equals the standard unit, then the asset scale is 0.
   * Note that this value is optional, and will default to 0 if not supplied.
   */
  AssetScale?: number
  /**
   * Specifies the maximum asset amount of this token that should ever be issued.
   * It is a non-negative integer string that can store a range of up to 63 bits. If not set, the max
   * amount will default to the largest unsigned 63-bit integer (0x7FFFFFFFFFFFFFFF or 9223372036854775807)
   *
   * Example:
   * ```
   * MaximumAmount: '9223372036854775807'
   * ```
   */
  MaximumAmount?: string
  /**
   * Specifies the fee to charged by the issuer for secondary sales of the Token,
   * if such sales are allowed. Valid values for this field are between 0 and 50,000 inclusive,
   * allowing transfer rates of between 0.000% and 50.000% in increments of 0.001.
   * The field must NOT be present if the `tfMPTCanTransfer` flag is not set.
   */
  TransferFee?: number
  /**
   * Arbitrary metadata about this issuance, in hex format.
   */
  MPTokenMetadata?: string | null
  Flags?: number | MPTokenIssuanceCreateFlagsInterface
}

export interface MPTokenIssuanceCreateMetadata extends TransactionMetadataBase {
  mpt_issuance_id?: string
}

/* eslint-disable max-lines-per-function -- Not needed to reduce function */
/**
 * Verify the form and type of an MPTokenIssuanceCreate at runtime.
 *
 * @param tx - An MPTokenIssuanceCreate Transaction.
 * @throws When the MPTokenIssuanceCreate is Malformed.
 */
export function validateMPTokenIssuanceCreate(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateOptionalField(tx, 'MaximumAmount', isString)
  validateOptionalField(tx, 'MPTokenMetadata', isString)
  validateOptionalField(tx, 'TransferFee', isNumber)
  validateOptionalField(tx, 'AssetScale', isNumber)

  if (typeof tx.MPTokenMetadata === 'string' && tx.MPTokenMetadata === '') {
    throw new ValidationError(
      'MPTokenIssuanceCreate: MPTokenMetadata must not be empty string',
    )
  }

  if (typeof tx.MPTokenMetadata === 'string' && !isHex(tx.MPTokenMetadata)) {
    throw new ValidationError(
      'MPTokenIssuanceCreate: MPTokenMetadata must be in hex format',
    )
  }

  if (typeof tx.MaximumAmount === 'string') {
    if (!INTEGER_SANITY_CHECK.exec(tx.MaximumAmount)) {
      throw new ValidationError('MPTokenIssuanceCreate: Invalid MaximumAmount')
    } else if (
      BigInt(tx.MaximumAmount) > BigInt(MAX_AMT) ||
      BigInt(tx.MaximumAmount) < BigInt(`0`)
    ) {
      throw new ValidationError(
        'MPTokenIssuanceCreate: MaximumAmount out of range',
      )
    }
  }

  if (typeof tx.TransferFee === 'number') {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Not necessary
    const flags = (tx.Flags ?? 0) as
      | number
      | MPTokenIssuanceCreateFlagsInterface
    const isTfMPTCanTransfer =
      typeof flags === 'number'
        ? isFlagEnabled(flags, MPTokenIssuanceCreateFlags.tfMPTCanTransfer)
        : flags.tfMPTCanTransfer ?? false

    if (tx.TransferFee < 0 || tx.TransferFee > MAX_TRANSFER_FEE) {
      throw new ValidationError(
        `MPTokenIssuanceCreate: TransferFee must be between 0 and ${MAX_TRANSFER_FEE}`,
      )
    }

    if (tx.TransferFee && !isTfMPTCanTransfer) {
      throw new ValidationError(
        'MPTokenIssuanceCreate: TransferFee cannot be provided without enabling tfMPTCanTransfer flag',
      )
    }
  }

  logWarningsForMPTMetadata(tx.MPTokenMetadata)
}
/* eslint-enable max-lines-per-function */

/* eslint-disable max-lines-per-function -- Required here as structure validation is verbose. */
/* eslint-disable max-statements -- Required here as structure validation is verbose. */
/* eslint-disable no-console -- This function is meant to print console warnings. */
/**
 * Logs warning messages if MPTokenMetadata does not adhere to XLS-89d standard.
 *
 * @param input - hex encoded MPTokenMetadata.
 *
 */
function logWarningsForMPTMetadata(input?: string): void {
  if (input == null) {
    return
  }

  let jsonMetaData: unknown

  try {
    jsonMetaData = JSON.parse(hexToString(input))
  } catch (_err) {
    console.warn(
      'MPTokenMetadata is not properly formatted as JSON as per the XLS-89d standard. ',
    )
    return
  }

  if (
    !(
      jsonMetaData != null &&
      typeof jsonMetaData === 'object' &&
      !Array.isArray(jsonMetaData)
    )
  ) {
    console.warn(
      'MPTokenMetadata is not properly formatted as JSON as per the XLS-89d standard. ',
    )
    return
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- It must be some JSON object.
  const obj = jsonMetaData as Record<string, unknown>

  // validating structure
  const incorrectRequiredFields = MPT_META_REQUIRED_FIELDS.filter(
    (field) => !isString(obj[field]),
  )

  if (incorrectRequiredFields.length > 0) {
    incorrectRequiredFields.forEach((field) =>
      console.warn(`${field} is required and must be string.`),
    )
    return
  }

  if (obj.desc != null && !isString(obj.desc)) {
    console.warn(`desc must be a string.`)
    return
  }

  if (obj.asset_subclass != null && !isString(obj.asset_subclass)) {
    console.warn(`asset_subclass must be a string.`)
    return
  }

  if (
    obj.additional_info != null &&
    !(
      isString(obj.additional_info) ||
      (typeof obj.additional_info === 'object' &&
        !Array.isArray(obj.additional_info))
    )
  ) {
    console.warn(`additional_info must be a string or JSON object.`)
    return
  }

  if (
    obj.urls != null &&
    (!Array.isArray(obj.urls) ||
      !obj.urls.every(isValidMPTokenMetadataUrlStructure))
  ) {
    console.warn(
      `urls field is not properly structured as per the XLS-89d standard.`,
    )
    return
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- The structure is validated above.
  const mptMPTokenMetadata = obj as unknown as MPTokenMetadata

  // validating content
  if (!TICKER_REGEX.test(mptMPTokenMetadata.ticker)) {
    console.warn(
      `ticker should have uppercase letters (A-Z) and digits (0-9) only. Max 6 characters recommended.`,
    )
  }

  if (!mptMPTokenMetadata.icon.startsWith('https://')) {
    console.warn(`icon should be a valid https url.`)
  }

  if (
    !MPT_META_ASSET_CLASSES.includes(
      mptMPTokenMetadata.asset_class.toLocaleLowerCase(),
    )
  ) {
    console.warn(
      `asset_class should be one of ${MPT_META_ASSET_CLASSES.join(', ')}.`,
    )
  }

  if (
    mptMPTokenMetadata.asset_subclass != null &&
    !MPT_META_ASSET_SUB_CLASSES.includes(
      mptMPTokenMetadata.asset_subclass.toLocaleLowerCase(),
    )
  ) {
    console.warn(
      `asset_subclass should be one of ${MPT_META_ASSET_SUB_CLASSES.join(
        ', ',
      )}.`,
    )
  }

  if (
    mptMPTokenMetadata.asset_class.toLocaleLowerCase() === 'rwa' &&
    mptMPTokenMetadata.asset_subclass == null
  ) {
    console.warn(`asset_subclass is required when asset_class is rwa.`)
  }

  if (
    mptMPTokenMetadata.urls != null &&
    !mptMPTokenMetadata.urls.every((ele) => ele.url.startsWith('https://'))
  ) {
    console.warn(`url should be a valid https url.`)
  }
}
/* eslint-enable max-lines-per-function */
/* eslint-enable max-statements */
/* eslint-enable no-console */

function isValidMPTokenMetadataUrlStructure(input: unknown): boolean {
  if (input == null) {
    return false
  }

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- Required here.
  const obj = input as Record<string, unknown>

  return (
    typeof obj === 'object' &&
    isString(obj.url) &&
    isString(obj.type) &&
    isString(obj.title)
  )
}
