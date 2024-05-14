import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isNumber,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

/**
 * A PriceData object represents the price information for a token pair.
 *
 */
export interface PriceData {
  PriceData: {
    /**
     * The primary asset in a trading pair. Any valid identifier, such as a stock symbol, bond CUSIP, or currency code is allowed.
     * For example, in the BTC/USD pair, BTC is the base asset; in 912810RR9/BTC, 912810RR9 is the base asset.
     */
    BaseAsset: string

    /**
     * The quote asset in a trading pair. The quote asset denotes the price of one unit of the base asset. For example, in the
     * BTC/USD pair,BTC is the base asset; in 912810RR9/BTC, 912810RR9 is the base asset.
     */
    QuoteAsset: string

    /**
     * The asset price after applying the Scale precision level. It's not included if the last update transaction didn't include
     * the BaseAsset/QuoteAsset pair.
     */
    AssetPrice?: number

    /**
     * The scaling factor to apply to an asset price. For example, if Scale is 6 and original price is 0.155, then the scaled
     * price is 155000. Valid scale ranges are 0-10. It's not included if the last update transaction didn't include the
     * BaseAsset/QuoteAsset pair.
     */
    Scale?: number
  }
}

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

  validateRequiredField(tx, 'PriceDataSeries', (value) => {
    if (!Array.isArray(value)) {
      throw new ValidationError('OracleSet: PriceDataSeries must be an array')
    }

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

      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
        'AssetPrice' in priceData.PriceData &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
        !isNumber(priceData.PriceData.AssetPrice)
      ) {
        throw new ValidationError('OracleSet: invalid field AssetPrice')
      }

      if (
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
        'Scale' in priceData.PriceData &&
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
        !isNumber(priceData.PriceData.Scale)
      ) {
        throw new ValidationError('OracleSet: invalid field Scale')
      }
    }
    return true
  })

  validateOptionalField(tx, 'Provider', isString)

  validateOptionalField(tx, 'URI', isString)

  validateOptionalField(tx, 'AssetClass', isString)
}
