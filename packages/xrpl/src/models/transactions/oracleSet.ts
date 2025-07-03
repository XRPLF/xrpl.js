import { ValidationError } from '../../errors'
import { PriceData } from '../common'
import { isHex } from '../utils'

import {
  BaseTransaction,
  isArray,
  isCurrency,
  isHexString,
  isNumber,
  isNumberWithBounds,
  isRecord,
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

  validateOptionalField(tx, 'Provider', isHexString)

  validateOptionalField(tx, 'URI', isHexString)

  validateOptionalField(tx, 'AssetClass', isHexString)

  /* eslint-disable max-lines-per-function -- necessary to validate many fields */
  validateRequiredField(
    tx,
    'PriceDataSeries',
    (value: unknown): value is PriceData => {
      if (!isArray(value)) {
        throw new ValidationError('OracleSet: PriceDataSeries must be an array')
      }

      if (value.length > PRICE_DATA_SERIES_MAX_LENGTH) {
        throw new ValidationError(
          `OracleSet: PriceDataSeries must have at most ${PRICE_DATA_SERIES_MAX_LENGTH} PriceData objects`,
        )
      }

      // TODO: add support for handling inner objects easier (similar to validateRequiredField/validateOptionalField)
      value.forEach((priceData, index) => {
        if (!isRecord(priceData) || !isRecord(priceData.PriceData)) {
          throw new ValidationError(
            'OracleSet: PriceDataSeries must be an array of objects',
          )
        }

        // check if priceData only has PriceData
        if (Object.keys(priceData).length !== 1) {
          throw new ValidationError(
            'OracleSet: PriceDataSeries must only have a single PriceData object',
          )
        }

        const priceDataInner = priceData.PriceData

        validateRequiredField(priceDataInner, 'BaseAsset', isCurrency, {
          paramName: `PriceDataSeries[${index}].BaseAsset`,
          txType: 'OracleSet',
        })

        validateRequiredField(priceDataInner, 'QuoteAsset', isCurrency, {
          paramName: `PriceDataSeries[${index}].QuoteAsset`,
          txType: 'OracleSet',
        })

        // Either AssetPrice and Scale are both present or both excluded
        if (
          (priceDataInner.AssetPrice == null) !==
          (priceDataInner.Scale == null)
        ) {
          throw new ValidationError(
            'OracleSet: PriceDataSeries must have both `AssetPrice` and `Scale` if any are present',
          )
        }

        validateOptionalField(
          priceDataInner,
          'AssetPrice',
          // eslint-disable-next-line max-nested-callbacks -- okay here
          (inp: unknown): inp is number | string =>
            isNumber(inp) || isHexString(inp),
          {
            paramName: `PriceDataSeries[${index}].AssetPrice`,
            txType: 'OracleSet',
          },
        )

        if ('AssetPrice' in priceDataInner) {
          if (isString(priceDataInner.AssetPrice)) {
            if (
              priceDataInner.AssetPrice.length < MINIMUM_ASSET_PRICE_LENGTH ||
              priceDataInner.AssetPrice.length > MAXIMUM_ASSET_PRICE_LENGTH
            ) {
              throw new ValidationError(
                `OracleSet: Length of AssetPrice field must be between ${MINIMUM_ASSET_PRICE_LENGTH} and ${MAXIMUM_ASSET_PRICE_LENGTH} characters long`,
              )
            }
          }
        }

        validateOptionalField(
          priceDataInner,
          'Scale',
          isNumberWithBounds(0, SCALE_MAX),
          {
            paramName: `PriceDataSeries[${index}].Scale`,
            txType: 'OracleSet',
          },
        )
      })
      return true
    },
  )
  /* eslint-enable max-lines-per-function */
}
