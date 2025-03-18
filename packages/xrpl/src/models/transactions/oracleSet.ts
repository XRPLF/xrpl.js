import { ValidationError } from '../../errors'
import { PriceData } from '../common'
import { isHex } from '../utils'

import {
  BaseTransaction,
  isNumber,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

const PRICE_DATA_SERIES_MAX_LENGTH = 10
const SCALE_MAX = 10
const MINIMUM_ASSET_PRICE_LENGTH = 1
const MAXIMUM_ASSET_PRICE_LENGTH = 16

/**
 * Creates a new Oracle ledger entry or updates the fields of an existing one, using the Oracle ID.
 *
 * The oracle provider must complete these steps before submitting this transaction:
 * 1. Create or own the XRPL account in the Owner field and have enough XRP to meet the reserve and transaction fee requirements.
 * 2. Publish the XRPL account public key, so it can be used for verification by dApps.
 * 3. Publish a registry of available price oracles with their unique OracleDocumentID.
 *
 * @category Transaction Models
 */
export interface OracleSet extends BaseTransaction {
  TransactionType: 'OracleSet'

  /**
   * A unique identifier of the price oracle for the Account.
   */
  OracleDocumentID: number

  /**
   * The time the data was last updated, represented as a unix timestamp in seconds.
   */
  LastUpdateTime: number

  /**
   * An array of up to 10 PriceData objects, each representing the price information
   * for a token pair. More than five PriceData objects require two owner reserves.
   */
  PriceDataSeries: PriceData[]

  /**
   * An arbitrary value that identifies an oracle provider, such as Chainlink, Band,
   * or DIA. This field is a string, up to 256 ASCII hex encoded characters (0x20-0x7E).
   * This field is required when creating a new Oracle ledger entry, but is optional for updates.
   */
  Provider?: string

  /**
   * An optional Universal Resource Identifier to reference price data off-chain. This field is limited to 256 bytes.
   */
  URI?: string

  /**
   * Describes the type of asset, such as "currency", "commodity", or "index". This field is a string, up to 16 ASCII
   * hex encoded characters (0x20-0x7E). This field is required when creating a new Oracle ledger entry, but is optional
   * for updates.
   */
  AssetClass?: string
}

/**
 * Verify the form and type of a OracleSet at runtime.
 *
 * @param tx - A OracleSet Transaction.
 * @throws When the OracleSet is malformed.
 */
// eslint-disable-next-line max-lines-per-function -- necessary to validate many fields
export function validateOracleSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'OracleDocumentID', isNumber)

  validateRequiredField(tx, 'LastUpdateTime', isNumber)

  validateOptionalField(tx, 'Provider', isString)

  validateOptionalField(tx, 'URI', isString)

  validateOptionalField(tx, 'AssetClass', isString)

  /* eslint-disable max-statements, max-lines-per-function -- necessary to validate many fields */
  validateRequiredField(tx, 'PriceDataSeries', (value) => {
    if (!Array.isArray(value)) {
      throw new ValidationError('OracleSet: PriceDataSeries must be an array')
    }

    if (value.length > PRICE_DATA_SERIES_MAX_LENGTH) {
      throw new ValidationError(
        `OracleSet: PriceDataSeries must have at most ${PRICE_DATA_SERIES_MAX_LENGTH} PriceData objects`,
      )
    }

    // TODO: add support for handling inner objects easier (similar to validateRequiredField/validateOptionalField)
    for (const priceData of value) {
      if (typeof priceData !== 'object') {
        throw new ValidationError(
          'OracleSet: PriceDataSeries must be an array of objects',
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
      if (priceData.PriceData == null) {
        throw new ValidationError(
          'OracleSet: PriceDataSeries must have a `PriceData` object',
        )
      }

      // check if priceData only has PriceData
      if (Object.keys(priceData).length !== 1) {
        throw new ValidationError(
          'OracleSet: PriceDataSeries must only have a single PriceData object',
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
      if (typeof priceData.PriceData.BaseAsset !== 'string') {
        throw new ValidationError(
          'OracleSet: PriceDataSeries must have a `BaseAsset` string',
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
      if (typeof priceData.PriceData.QuoteAsset !== 'string') {
        throw new ValidationError(
          'OracleSet: PriceDataSeries must have a `QuoteAsset` string',
        )
      }

      // Either AssetPrice and Scale are both present or both excluded
      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
        (priceData.PriceData.AssetPrice == null) !==
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
        (priceData.PriceData.Scale == null)
      ) {
        throw new ValidationError(
          'OracleSet: PriceDataSeries must have both `AssetPrice` and `Scale` if any are present',
        )
      }

      /* eslint-disable @typescript-eslint/no-unsafe-member-access, max-depth --
      we need to validate priceData.PriceData.AssetPrice value */
      if ('AssetPrice' in priceData.PriceData) {
        if (!isNumber(priceData.PriceData.AssetPrice)) {
          if (typeof priceData.PriceData.AssetPrice !== 'string') {
            throw new ValidationError(
              'OracleSet: Field AssetPrice must be a string or a number',
            )
          }
          if (!isHex(priceData.PriceData.AssetPrice)) {
            throw new ValidationError(
              'OracleSet: Field AssetPrice must be a valid hex string',
            )
          }
          if (
            priceData.PriceData.AssetPrice.length <
              MINIMUM_ASSET_PRICE_LENGTH ||
            priceData.PriceData.AssetPrice.length > MAXIMUM_ASSET_PRICE_LENGTH
          ) {
            throw new ValidationError(
              `OracleSet: Length of AssetPrice field must be between ${MINIMUM_ASSET_PRICE_LENGTH} and ${MAXIMUM_ASSET_PRICE_LENGTH} characters long`,
            )
          }
        }
      }
      /* eslint-enable @typescript-eslint/no-unsafe-member-access, max-depth */

      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
        'Scale' in priceData.PriceData &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
        !isNumber(priceData.PriceData.Scale)
      ) {
        throw new ValidationError('OracleSet: invalid field Scale')
      }

      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
        priceData.PriceData.Scale < 0 ||
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
        priceData.PriceData.Scale > SCALE_MAX
      ) {
        throw new ValidationError(
          `OracleSet: Scale must be in range 0-${SCALE_MAX}`,
        )
      }
    }
    return true
  })
  /* eslint-enable max-statements, max-lines-per-function */
}
