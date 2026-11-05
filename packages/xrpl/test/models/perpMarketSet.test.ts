import { PerpMarketSet } from '../../src/models/transactions'
import {
  PerpMarketSetFlags,
  validatePerpMarketSet,
} from '../../src/models/transactions/perpMarketSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePerpMarketSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePerpMarketSet, message)

const MARKET_ID =
  'AB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5'

/**
 * PerpMarketSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PerpMarketSet', function () {
  let tx: PerpMarketSet

  beforeEach(function () {
    tx = {
      TransactionType: 'PerpMarketSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ExchangeID:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
      BaseAsset: 'BTC',
      QuoteAsset: 'USD',
      IndexOracles: [
        {
          IndexOracle: {
            Owner: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
            OracleDocumentID: 1,
          },
        },
      ],
      IndexMaxLedgers: 10,
      PriceTick: '0.5',
      LotSize: '0.001',
      MarginTiers: [
        {
          MarginTier: {
            NotionalMax: '100000',
            InitialMarginRate: 10000,
            MaintenanceMarginRate: 5000,
          },
        },
        {
          MarginTier: {
            NotionalMax: '1000000',
            InitialMarginRate: 20000,
            MaintenanceMarginRate: 10000,
          },
        },
      ],
      OpenInterestMax: '5000000',
      OrderPriceBand: 10000,
      Flags: { tfPerpIsolatedOnly: true },
    }
  })

  it('verifies valid PerpMarketSet creation', function () {
    assertValid(tx)
  })

  it('verifies valid PerpMarketSet update', function () {
    tx = {
      TransactionType: 'PerpMarketSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MarketID: MARKET_ID,
      OpenInterestMax: '4000000',
      OrderPriceBand: 5000,
      Flags: PerpMarketSetFlags.tfPerpMarketSettle,
    }
    assertValid(tx)
  })

  it('throws w/ creation missing MarginTiers', function () {
    delete tx.MarginTiers
    assertInvalid(tx, 'PerpMarketSet: missing field MarginTiers')
  })

  it('throws w/ creation missing OrderPriceBand', function () {
    delete tx.OrderPriceBand
    assertInvalid(tx, 'PerpMarketSet: missing field OrderPriceBand')
  })

  it('throws w/ creation missing BaseAsset', function () {
    delete tx.BaseAsset
    assertInvalid(tx, 'PerpMarketSet: missing field BaseAsset')
  })

  it('throws w/ invalid PriceTick', function () {
    // @ts-expect-error for test
    tx.PriceTick = 0.5
    assertInvalid(tx, 'PerpMarketSet: invalid field PriceTick')
  })

  it('throws w/ invalid IndexOracles', function () {
    tx.IndexOracles = [
      // @ts-expect-error for test
      { IndexOracle: { Owner: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW' } },
    ]
    assertInvalid(tx, 'PerpMarketSet: invalid field IndexOracles')
  })

  it('throws w/ more than 5 IndexOracles', function () {
    tx.IndexOracles = Array.from({ length: 6 }, (_, index) => ({
      IndexOracle: {
        Owner: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
        OracleDocumentID: index,
      },
    }))
    assertInvalid(tx, 'PerpMarketSet: invalid field IndexOracles')
  })

  it('throws w/ invalid MarginTiers', function () {
    // @ts-expect-error for test
    tx.MarginTiers = [{ MarginTier: { NotionalMax: 100000 } }]
    assertInvalid(tx, 'PerpMarketSet: invalid field MarginTiers')
  })

  it('throws w/ tfPerpMarketSettle on creation', function () {
    tx.Flags = { tfPerpMarketSettle: true }
    assertInvalid(
      tx,
      'PerpMarketSet: tfPerpMarketSettle is only valid on an update',
    )
  })

  it('throws w/ tfPerpIsolatedOnly on update', function () {
    tx = {
      TransactionType: 'PerpMarketSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MarketID: MARKET_ID,
      Flags: PerpMarketSetFlags.tfPerpIsolatedOnly,
    }
    assertInvalid(
      tx,
      'PerpMarketSet: tfPerpIsolatedOnly is only valid on creation',
    )
  })

  it('throws w/ an update that changes a fixed field', function () {
    tx.MarketID = MARKET_ID
    tx.Flags = 0
    assertInvalid(tx, 'PerpMarketSet: ExchangeID can only be set on creation')
  })

  it('throws w/ an update that changes IndexOracles', function () {
    tx = {
      TransactionType: 'PerpMarketSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MarketID: MARKET_ID,
      IndexOracles: tx.IndexOracles,
    }
    assertInvalid(tx, 'PerpMarketSet: IndexOracles can only be set on creation')
  })

  it('throws w/ an update that changes IndexMaxLedgers', function () {
    tx = {
      TransactionType: 'PerpMarketSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MarketID: MARKET_ID,
      IndexMaxLedgers: 5,
    }
    assertInvalid(
      tx,
      'PerpMarketSet: IndexMaxLedgers can only be set on creation',
    )
  })
})
