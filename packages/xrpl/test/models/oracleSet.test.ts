import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { validateOracleSet } from '../../src/models/transactions/oracleSet'

/**
 * OracleSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('OracleSet', function () {
  let tx

  beforeEach(function () {
    tx = {
      TransactionType: 'OracleSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      OracleDocumentID: 1234,
      LastUpdateTime: 1234,
      Provider: 'chainlink',
      URI: '6469645F6578616D706C65',
      AssetClass: 'currency',
      PriceDataSeries: [
        {
          BaseAsset: 'XRP',
          QuoteAsset: 'USD',
          AssetPrice: 0.5,
          Scale: 6,
        },
      ],
    } as any
  })

  it('verifies valid OracleSet', function () {
    assert.doesNotThrow(() => validateOracleSet(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws w/ missing field OracleDocumentID`, function () {
    delete tx.OracleDocumentID
    const errorMessage = 'OracleSet: missing field OracleDocumentID'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid OracleDocumentID`, function () {
    tx.OracleDocumentID = '1234'
    const errorMessage = 'OracleSet: invalid field OracleDocumentID'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing field LastUpdateTime`, function () {
    delete tx.LastUpdateTime
    const errorMessage = 'OracleSet: missing field LastUpdateTime'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid LastUpdateTime`, function () {
    tx.LastUpdateTime = '1234'
    const errorMessage = 'OracleSet: invalid field LastUpdateTime'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing invalid Provider`, function () {
    tx.Provider = 1234
    const errorMessage = 'OracleSet: invalid field Provider'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing invalid URI`, function () {
    tx.URI = 1234
    const errorMessage = 'OracleSet: invalid field URI'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing invalid AssetClass`, function () {
    tx.AssetClass = 1234
    const errorMessage = 'OracleSet: invalid field AssetClass'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid PriceDataSeries must be an array`, function () {
    tx.PriceDataSeries = 1234
    const errorMessage = 'OracleSet: PriceDataSeries must be an array'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid PriceDataSeries must be an array of objects`, function () {
    tx.PriceDataSeries = [1234]
    const errorMessage =
      'OracleSet: PriceDataSeries must be an array of objects'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing PriceDataSeries[0].BaseAsset`, function () {
    delete tx.PriceDataSeries[0].BaseAsset
    const errorMessage =
      'OracleSet: PriceDataSeries must have a `BaseAsset` string'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing PriceDataSeries[0].QuoteAsset`, function () {
    delete tx.PriceDataSeries[0].QuoteAsset
    const errorMessage =
      'OracleSet: PriceDataSeries must have a `QuoteAsset` string'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid PriceDataSeries[0].AssetPrice`, function () {
    tx.PriceDataSeries[0].AssetPrice = '1234'
    const errorMessage = 'OracleSet: invalid field AssetPrice'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid PriceDataSeries[0].Scale`, function () {
    tx.PriceDataSeries[0].Scale = '1234'
    const errorMessage = 'OracleSet: invalid field Scale'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
