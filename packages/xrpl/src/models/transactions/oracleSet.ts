import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isNumber,
  isString,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'

// TODO: add docs

export interface PriceData {
  PriceData: {
    BaseAsset: string
    QuoteAsset: string
    AssetPrice?: number
    Scale?: number
  }
}

/**
 * @category Transaction Models
 */
export interface OracleSet extends BaseTransaction {
  TransactionType: 'OracleSet'
  OracleDocumentID: number
  LastUpdateTime: number
  PriceDataSeries: PriceData[]
  Provider?: string
  URI?: string
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
