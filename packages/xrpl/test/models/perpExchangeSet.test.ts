import { PerpExchangeSet } from '../../src/models/transactions'
import { validatePerpExchangeSet } from '../../src/models/transactions/perpExchangeSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePerpExchangeSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePerpExchangeSet, message)

const EXCHANGE_ID =
  'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5'

/**
 * PerpExchangeSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PerpExchangeSet', function () {
  let tx: PerpExchangeSet

  beforeEach(function () {
    tx = {
      TransactionType: 'PerpExchangeSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Asset: {
        currency: 'USD',
        issuer: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
      },
      Scale: 6,
      DomainID:
        'AB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
      VaultID:
        'CB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
      MakerFee: 100,
      TakerFee: 300,
      OwnerFeeShare: 20000,
      VaultFeeShare: 30000,
      BuilderFeeMax: 500,
      CoverRateMinimum: 1000,
      VaultLossLimit: 5000,
      VaultLossWindow: 86400,
      ParameterDelay: 604800,
      Data: 'ABCD',
    }
  })

  it('verifies valid PerpExchangeSet creation', function () {
    assertValid(tx)
  })

  it('verifies valid PerpExchangeSet update', function () {
    tx = {
      TransactionType: 'PerpExchangeSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ExchangeID: EXCHANGE_ID,
      TakerFee: 250,
      Data: 'ABCD',
    }
    assertValid(tx)
  })

  it('throws w/ creation missing Asset', function () {
    delete tx.Asset
    assertInvalid(tx, 'PerpExchangeSet: missing field Asset')
  })

  it('throws w/ creation missing ParameterDelay', function () {
    delete tx.ParameterDelay
    assertInvalid(tx, 'PerpExchangeSet: missing field ParameterDelay')
  })

  it('throws w/ invalid MakerFee', function () {
    // @ts-expect-error for test
    tx.MakerFee = '100'
    assertInvalid(tx, 'PerpExchangeSet: invalid field MakerFee')
  })

  it('throws w/ invalid Asset', function () {
    // @ts-expect-error for test
    tx.Asset = 'USD'
    assertInvalid(tx, 'PerpExchangeSet: invalid field Asset')
  })

  it('throws w/ Data that is not hex', function () {
    tx.Data = 'not hex'
    assertInvalid(tx, 'PerpExchangeSet: invalid field Data')
  })

  it('throws w/ VaultID and no VaultLossWindow', function () {
    delete tx.VaultLossWindow
    assertInvalid(
      tx,
      'PerpExchangeSet: VaultID and VaultLossWindow must be present together',
    )
  })

  it('throws w/ fee shares above 100000', function () {
    tx.OwnerFeeShare = 60000
    tx.VaultFeeShare = 50000
    assertInvalid(
      tx,
      'PerpExchangeSet: OwnerFeeShare plus VaultFeeShare must not exceed 100000',
    )
  })

  it('throws w/ an update that changes a creation-only field', function () {
    tx.ExchangeID = EXCHANGE_ID
    assertInvalid(tx, 'PerpExchangeSet: Asset can only be set on creation')
  })
})
