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
  BaseAsset: string
  QuoteAsset: string
  AssetPrice?: number
  Scale?: number
}

/**
 * @category Transaction Models
 */
export interface OracleSet extends BaseTransaction {
  TransactionType: 'OracleSet'
  OracleDocumentID: number
  LastUpdateTime: number
  Provider?: string
  URI?: string
  AssetClass?: string
  PriceDataSeries?: PriceData[]
}

/**
 * Verify the form and type of a OracleSet at runtime.
 *
 * @param tx - A OracleSet Transaction.
 * @throws When the OracleSet is malformed.
 */
export function validateOracleSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'OracleDocumentID', isNumber)

  validateRequiredField(tx, 'LastUpdateTime', isNumber)

  validateOptionalField(tx, 'Provider', isString)

  validateOptionalField(tx, 'URI', isString)

  validateOptionalField(tx, 'AssetClass', isString)

  validateOptionalField(tx, 'PriceDataSeries', (value) => {
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
      if (typeof priceData.BaseAsset !== 'string') {
        throw new ValidationError(
          'OracleSet: PriceDataSeries must have a `BaseAsset` string',
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
      if (typeof priceData.QuoteAsset !== 'string') {
        throw new ValidationError(
          'OracleSet: PriceDataSeries must have a `QuoteAsset` string',
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
      if ('AssetPrice' in priceData && !isNumber(priceData.AssetPrice)) {
        throw new ValidationError('OracleSet: invalid field AssetPrice')
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access -- we are validating the type
      if ('Scale' in priceData && !isNumber(priceData.Scale)) {
        throw new ValidationError('OracleSet: invalid field Scale')
      }
    }
    return true
  })
}
