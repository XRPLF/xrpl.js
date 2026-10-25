import { ValidationError } from '../../errors'
import { INTEGER_SANITY_CHECK, isHex } from '../utils'
import { MAX_MPT_META_BYTE_LENGTH } from '../utils/mptokenMetadata'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isHexWithByteLength,
  isNumber,
  isString,
  validateBaseTransaction,
  validateFlagsMask,
  validateOptionalField,
  validateRequiredField,
} from './common'
import { MAX_TRANSFER_FEE } from './MPTokenIssuanceCreate'

/** Byte length of an MPTokenIssuanceID (UINT192). */
const MPT_ISSUANCE_ID_BYTES = 24

/** Largest MaximumAmount of a TokenIssuance, in base units (10^15). */
const MAX_TOKEN_ISSUANCE_AMOUNT = BigInt('1000000000000000')

/** Largest TokenScale of a TokenIssuance. */
const MAX_TOKEN_SCALE = 18

/** A 3-character currency code in rippled's ISO character set. */
const ISO_CURRENCY_CODE = /^[A-Za-z0-9<>(){}[\]|?!@#$%^&*]{3}$/u

/** A 160-bit currency code in hex. */
const HEX_CURRENCY_CODE = /^[0-9A-Fa-f]{40}$/u

/** The hex currency codes rippled refuses to parse (`badCurrency`, `noCurrency`). */
const UNPARSEABLE_CURRENCY_CODES = [
  '0000000000000000000000005852500000000000',
  '0000000000000000000000000000000000000001',
]

/** The all-zero hex currency code, which rippled reads as XRP. */
const XRP_HEX_CURRENCY_CODE = '0000000000000000000000000000000000000000'

/**
 * Transaction Flags for a {@link TokenIssuanceCreate} transaction.
 *
 * @category Transaction Flags
 */
export enum TokenIssuanceCreateFlags {
  /** Sets `lsfTokenCannotLock`: the issuer renounces locking this currency. */
  tfTokenCannotLock = 0x00000001,
}

/**
 * Map of flags to boolean values representing {@link TokenIssuanceCreate}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export type TokenIssuanceCreateFlagsInterface = GlobalFlagsInterface & {
  tfTokenCannotLock?: boolean
}

/**
 * The TokenIssuanceCreate transaction creates a TokenIssuance object that
 * describes an issuer's IOU currency, optionally bound to an MPT issuance.
 *
 * @category Transaction Models
 */
export interface TokenIssuanceCreate extends BaseTransaction {
  TransactionType: 'TokenIssuanceCreate'
  Flags?: number | TokenIssuanceCreateFlagsInterface

  /** The currency code of the IOU (3-character code or 40-character hex). */
  Currency: string

  /**
   * The supply cap, in base units, as a base-10 integer string between 1 and
   * 10^15. Requires TokenScale.
   */
  MaximumAmount?: string

  /**
   * The number of decimal places of one base unit: one base unit is
   * 10^-TokenScale of the IOU. Between 0 and 18.
   */
  TokenScale?: number

  /** The MPTokenIssuance the IOU converts to and from. Requires TokenScale. */
  MPTokenIssuanceID?: string

  /** The transfer fee in tenths of a basis point, between 0 and 50,000. */
  TransferFee?: number

  /** Arbitrary metadata in hex, between 1 and 1024 bytes. */
  MPTokenMetadata?: string
}

/**
 * Whether the input is a currency code rippled parses: a 3-character code, a
 * 40-character hex code, or the empty string (XRP).
 *
 * @param input - The value to check.
 * @returns Whether the input is a parseable currency code.
 */
export function isCurrencyCode(input: unknown): input is string {
  if (!isString(input)) {
    return false
  }
  if (HEX_CURRENCY_CODE.test(input)) {
    return !UNPARSEABLE_CURRENCY_CODES.includes(input.toUpperCase())
  }
  return input === '' || ISO_CURRENCY_CODE.test(input)
}

/**
 * Whether a parseable currency code denotes XRP.
 *
 * @param code - The currency code.
 * @returns Whether rippled reads the code as XRP.
 */
function isXrpCurrencyCode(code: string): boolean {
  return code === '' || code === 'XRP' || code === XRP_HEX_CURRENCY_CODE
}

/**
 * Whether the input is non-empty hex metadata of at most 1024 bytes.
 *
 * @param metadata - The hex metadata.
 * @returns Whether the metadata has a legal length.
 */
function isTokenMetadata(metadata: string): boolean {
  const byteLength = metadata.length / 2
  return (
    isHex(metadata) &&
    Number.isInteger(byteLength) &&
    byteLength <= MAX_MPT_META_BYTE_LENGTH
  )
}

/**
 * Verify the TransferFee, MPTokenMetadata and MPTokenIssuanceID fields that
 * TokenIssuanceCreate and TokenIssuanceSet share.
 *
 * @param tx - A TokenIssuanceCreate or TokenIssuanceSet transaction.
 * @throws When one of the fields is malformed.
 */
export function validateTokenIssuanceSettings(
  tx: Record<string, unknown>,
): void {
  const txType = String(tx.TransactionType)
  validateOptionalField(
    tx,
    'MPTokenIssuanceID',
    isHexWithByteLength(MPT_ISSUANCE_ID_BYTES),
  )
  validateOptionalField(tx, 'TransferFee', isNumber)
  validateOptionalField(tx, 'MPTokenMetadata', isString)

  if (
    tx.TransferFee !== undefined &&
    (!Number.isInteger(tx.TransferFee) ||
      tx.TransferFee < 0 ||
      tx.TransferFee > MAX_TRANSFER_FEE)
  ) {
    throw new ValidationError(
      `${txType}: TransferFee must be an integer between 0 and ${MAX_TRANSFER_FEE}`,
    )
  }

  if (
    tx.MPTokenMetadata !== undefined &&
    !isTokenMetadata(tx.MPTokenMetadata)
  ) {
    throw new ValidationError(
      `${txType}: MPTokenMetadata must be a non-empty hex string of at most ${MAX_MPT_META_BYTE_LENGTH} bytes`,
    )
  }
}

/**
 * Verify MaximumAmount and TokenScale, and that TokenScale is present when
 * the transaction counts in base units.
 *
 * @param tx - A TokenIssuanceCreate transaction.
 * @throws When MaximumAmount or TokenScale is malformed or TokenScale is missing.
 */
function validateBaseUnits(tx: Record<string, unknown>): void {
  validateOptionalField(tx, 'MaximumAmount', isString)
  validateOptionalField(tx, 'TokenScale', isNumber)

  if (
    tx.MaximumAmount !== undefined &&
    (!INTEGER_SANITY_CHECK.test(tx.MaximumAmount) ||
      BigInt(tx.MaximumAmount) === BigInt(0) ||
      BigInt(tx.MaximumAmount) > MAX_TOKEN_ISSUANCE_AMOUNT)
  ) {
    throw new ValidationError(
      `TokenIssuanceCreate: MaximumAmount must be an integer between 1 and ${MAX_TOKEN_ISSUANCE_AMOUNT}`,
    )
  }

  if (
    tx.TokenScale !== undefined &&
    (!Number.isInteger(tx.TokenScale) ||
      tx.TokenScale < 0 ||
      tx.TokenScale > MAX_TOKEN_SCALE)
  ) {
    throw new ValidationError(
      `TokenIssuanceCreate: TokenScale must be an integer between 0 and ${MAX_TOKEN_SCALE}`,
    )
  }

  if (
    (tx.MaximumAmount !== undefined || tx.MPTokenIssuanceID !== undefined) &&
    tx.TokenScale === undefined
  ) {
    throw new ValidationError(
      'TokenIssuanceCreate: TokenScale is required with MaximumAmount or MPTokenIssuanceID',
    )
  }
}

/**
 * Verify the form and type of a {@link TokenIssuanceCreate} at runtime.
 *
 * @param tx - A {@link TokenIssuanceCreate} Transaction.
 * @throws When the {@link TokenIssuanceCreate} is malformed.
 */
export function validateTokenIssuanceCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateFlagsMask(tx, TokenIssuanceCreateFlags)
  validateRequiredField(tx, 'Currency', isCurrencyCode)

  if (isXrpCurrencyCode(tx.Currency)) {
    throw new ValidationError('TokenIssuanceCreate: Currency must not be XRP')
  }

  validateTokenIssuanceSettings(tx)
  validateBaseUnits(tx)
}
