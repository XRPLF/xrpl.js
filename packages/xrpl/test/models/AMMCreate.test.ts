import { validateAMMCreate } from '../../src/models/transactions/AMMCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateAMMCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateAMMCreate, message)

/**
 * AMMCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMCreate', function () {
  let ammCreate: any

  beforeEach(function () {
    ammCreate = {
      TransactionType: 'AMMCreate',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Amount: '1000',
      Amount2: {
        currency: 'USD',
        issuer: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
        value: '1000',
      },
      TradingFee: 12,
      Sequence: 1337,
    }
  })

  it(`verifies valid AMMCreate`, function () {
    assertValid(ammCreate)
  })

  it(`throws w/ missing Amount`, function () {
    delete ammCreate.Amount
    const errorMessage = 'AMMCreate: missing field Amount'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws w/ Amount must be an Amount`, function () {
    ammCreate.Amount = 1000
    const errorMessage = 'AMMCreate: invalid field Amount'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws w/ missing Amount2`, function () {
    delete ammCreate.Amount2
    const errorMessage = 'AMMCreate: missing field Amount2'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws w/ Amount2 must be an Amount`, function () {
    ammCreate.Amount2 = 1000
    const errorMessage = 'AMMCreate: invalid field Amount2'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws w/ missing TradingFee`, function () {
    delete ammCreate.TradingFee
    const errorMessage = 'AMMCreate: missing field TradingFee'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws w/ TradingFee must be a number`, function () {
    ammCreate.TradingFee = '12'
    const errorMessage = 'AMMCreate: invalid field TradingFee'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws when TradingFee is greater than 1000`, function () {
    ammCreate.TradingFee = 1001
    const errorMessage = 'AMMCreate: TradingFee must be between 0 and 1000'
    assertInvalid(ammCreate, errorMessage)
  })

  it(`throws when TradingFee is a negative number`, function () {
    ammCreate.TradingFee = -1
    const errorMessage = 'AMMCreate: TradingFee must be between 0 and 1000'
    assertInvalid(ammCreate, errorMessage)
  })

  describe('CurveType', function () {
    it(`verifies valid AMMCreate with CurveType 0 and no curve parameters`, function () {
      ammCreate.CurveType = 0
      assertValid(ammCreate)
    })

    it(`verifies valid concentrated liquidity AMMCreate`, function () {
      ammCreate.CurveType = 1
      ammCreate.FeeTier = 2
      assertValid(ammCreate)
    })

    it(`verifies valid StableSwap AMMCreate`, function () {
      ammCreate.CurveType = 2
      ammCreate.Amplification = 100
      assertValid(ammCreate)
    })

    it(`verifies valid binned AMMCreate`, function () {
      ammCreate.CurveType = 3
      ammCreate.BinStep = 25
      assertValid(ammCreate)
    })

    it(`throws w/ invalid CurveType`, function () {
      ammCreate.CurveType = '1'
      assertInvalid(ammCreate, 'AMMCreate: invalid field CurveType')
    })

    it(`throws w/ CurveType above 3`, function () {
      ammCreate.CurveType = 4
      assertInvalid(ammCreate, 'AMMCreate: CurveType must be between 0 and 3')
    })

    it(`throws w/ invalid FeeTier`, function () {
      ammCreate.FeeTier = '2'
      assertInvalid(ammCreate, 'AMMCreate: invalid field FeeTier')
    })

    it(`throws w/ invalid Amplification`, function () {
      ammCreate.Amplification = '100'
      assertInvalid(ammCreate, 'AMMCreate: invalid field Amplification')
    })

    it(`throws w/ invalid BinStep`, function () {
      ammCreate.BinStep = '25'
      assertInvalid(ammCreate, 'AMMCreate: invalid field BinStep')
    })

    it(`throws w/ concentrated liquidity and no FeeTier`, function () {
      ammCreate.CurveType = 1
      assertInvalid(
        ammCreate,
        'AMMCreate: FeeTier is required when CurveType is 1',
      )
    })

    it(`throws w/ FeeTier above 3`, function () {
      ammCreate.CurveType = 1
      ammCreate.FeeTier = 4
      assertInvalid(ammCreate, 'AMMCreate: FeeTier must be between 0 and 3')
    })

    it(`throws w/ StableSwap and no Amplification`, function () {
      ammCreate.CurveType = 2
      assertInvalid(
        ammCreate,
        'AMMCreate: Amplification is required when CurveType is 2',
      )
    })

    it(`throws w/ Amplification below 1`, function () {
      ammCreate.CurveType = 2
      ammCreate.Amplification = 0
      assertInvalid(
        ammCreate,
        'AMMCreate: Amplification must be between 1 and 5000',
      )
    })

    it(`throws w/ Amplification above 5000`, function () {
      ammCreate.CurveType = 2
      ammCreate.Amplification = 5001
      assertInvalid(
        ammCreate,
        'AMMCreate: Amplification must be between 1 and 5000',
      )
    })

    it(`throws w/ binned and no BinStep`, function () {
      ammCreate.CurveType = 3
      assertInvalid(
        ammCreate,
        'AMMCreate: BinStep is required when CurveType is 3',
      )
    })

    it(`throws w/ BinStep not in the allowed set`, function () {
      ammCreate.CurveType = 3
      ammCreate.BinStep = 2
      assertInvalid(
        ammCreate,
        'AMMCreate: BinStep must be one of 1, 5, 10, 25, 100',
      )
    })
  })
})
