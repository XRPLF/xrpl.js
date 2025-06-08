import { stringToHex } from '@xrplf/isomorphic/utils'
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
      LastUpdateTime: 768062172,
      PriceDataSeries: [
        {
          PriceData: {
            BaseAsset: 'XRP',
            QuoteAsset: 'USD',
            AssetPrice: 740,
            Scale: 3,
          },
        },
      ],
      Provider: stringToHex('chainlink'),
      URI: '6469645F6578616D706C65',
      AssetClass: stringToHex('currency'),
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
    tx.LastUpdateTime = '768062172'
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

  it(`throws w/ PriceDataSeries must have at most 10 PriceData objects`, function () {
    tx.PriceDataSeries = new Array(11).fill({
      PriceData: {
        BaseAsset: 'XRP',
        QuoteAsset: 'USD',
        AssetPrice: 740,
        Scale: 3,
      },
    })
    const errorMessage =
      'OracleSet: PriceDataSeries must have at most 10 PriceData objects'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ PriceDataSeries must have a PriceData object`, function () {
    delete tx.PriceDataSeries[0].PriceData
    const errorMessage =
      'OracleSet: PriceDataSeries must have a `PriceData` object'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ PriceDataSeries must only have a single PriceData object`, function () {
    tx.PriceDataSeries[0].ExtraProp = 'extraprop'
    const errorMessage =
      'OracleSet: PriceDataSeries must only have a single PriceData object'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing BaseAsset of PriceDataSeries`, function () {
    delete tx.PriceDataSeries[0].PriceData.BaseAsset
    const errorMessage =
      'OracleSet: PriceDataSeries must have a `BaseAsset` string'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing QuoteAsset of PriceDataSeries`, function () {
    delete tx.PriceDataSeries[0].PriceData.QuoteAsset
    const errorMessage =
      'OracleSet: PriceDataSeries must have a `QuoteAsset` string'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing AssetPrice with Scale present of PriceDataSeries`, function () {
    delete tx.PriceDataSeries[0].PriceData.AssetPrice
    const errorMessage =
      'OracleSet: PriceDataSeries must have both `AssetPrice` and `Scale` if any are present'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ missing Scale with AssetPrice present of PriceDataSeries`, function () {
    delete tx.PriceDataSeries[0].PriceData.Scale
    const errorMessage =
      'OracleSet: PriceDataSeries must have both `AssetPrice` and `Scale` if any are present'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid AssetPrice of PriceDataSeries`, function () {
    // value cannot be parsed as hexadecimal number
    tx.PriceDataSeries[0].PriceData.AssetPrice = 'ghij'
    const errorMessage =
      'OracleSet: Field AssetPrice must be a valid hex string'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`verifies valid AssetPrice of PriceDataSeries`, function () {
    // valid string which can be parsed as hexadecimal number
    tx.PriceDataSeries[0].PriceData.AssetPrice = 'ab15'
    assert.doesNotThrow(() => validate(tx))
  })

  it(`throws w/ invalid AssetPrice type in PriceDataSeries`, function () {
    tx.PriceDataSeries[0].PriceData.AssetPrice = ['sample', 'invalid', 'type']
    const errorMessage =
      'OracleSet: Field AssetPrice must be a string or a number'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ invalid Scale of PriceDataSeries`, function () {
    tx.PriceDataSeries[0].PriceData.Scale = '1234'
    const errorMessage = 'OracleSet: invalid field Scale'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ Scale must be in range 0-10 when above max`, function () {
    tx.PriceDataSeries[0].PriceData.Scale = 11
    const errorMessage = 'OracleSet: Scale must be in range 0-10'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it(`throws w/ Scale must be in range 0-10 when below min`, function () {
    tx.PriceDataSeries[0].PriceData.Scale = -1
    const errorMessage = 'OracleSet: Scale must be in range 0-10'
    assert.throws(() => validateOracleSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
