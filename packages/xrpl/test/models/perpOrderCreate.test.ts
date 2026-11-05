import { PerpOrderCreate } from '../../src/models/transactions'
import {
  PerpOrderCreateFlags,
  validatePerpOrderCreate,
} from '../../src/models/transactions/perpOrderCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validatePerpOrderCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validatePerpOrderCreate, message)

const AT_MOST_ONE_TIME_IN_FORCE =
  'PerpOrderCreate: at most one of tfPerpPostOnly, tfImmediateOrCancel and tfFillOrKill may be set'

/**
 * PerpOrderCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('PerpOrderCreate', function () {
  let tx: PerpOrderCreate

  beforeEach(function () {
    tx = {
      TransactionType: 'PerpOrderCreate',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      MarketID:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
      LimitPrice: '2.5',
      Size: '10',
      OfferSequence: 3,
      Expiration: 820000000,
      Builder: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
      BuilderFee: 100,
      Flags: {
        tfPerpSell: true,
        tfPerpReduceOnly: true,
        tfPerpPostOnly: true,
      },
    }
  })

  it('verifies valid PerpOrderCreate', function () {
    assertValid(tx)
  })

  it('verifies valid PerpOrderCreate w/ numeric flags', function () {
    tx.Flags =
      PerpOrderCreateFlags.tfPerpSell + PerpOrderCreateFlags.tfFillOrKill
    assertValid(tx)
  })

  it('throws w/ missing MarketID', function () {
    // @ts-expect-error for test
    tx.MarketID = undefined
    assertInvalid(tx, 'PerpOrderCreate: missing field MarketID')
  })

  it('throws w/ missing LimitPrice', function () {
    // @ts-expect-error for test
    tx.LimitPrice = undefined
    assertInvalid(tx, 'PerpOrderCreate: missing field LimitPrice')
  })

  it('throws w/ missing Size', function () {
    // @ts-expect-error for test
    tx.Size = undefined
    assertInvalid(tx, 'PerpOrderCreate: missing field Size')
  })

  it('throws w/ invalid LimitPrice', function () {
    tx.LimitPrice = 'two'
    assertInvalid(tx, 'PerpOrderCreate: invalid field LimitPrice')
  })

  it('throws w/ invalid Builder', function () {
    // @ts-expect-error for test
    tx.Builder = 12
    assertInvalid(tx, 'PerpOrderCreate: invalid field Builder')
  })

  it('throws w/ Builder and no BuilderFee', function () {
    delete tx.BuilderFee
    assertInvalid(
      tx,
      'PerpOrderCreate: Builder and BuilderFee must be present together',
    )
  })

  it('throws w/ tfPerpPostOnly and tfImmediateOrCancel', function () {
    tx.Flags = { tfPerpPostOnly: true, tfImmediateOrCancel: true }
    assertInvalid(tx, AT_MOST_ONE_TIME_IN_FORCE)
  })

  it('throws w/ tfImmediateOrCancel and tfFillOrKill', function () {
    tx.Flags =
      PerpOrderCreateFlags.tfImmediateOrCancel +
      PerpOrderCreateFlags.tfFillOrKill
    assertInvalid(tx, AT_MOST_ONE_TIME_IN_FORCE)
  })
})
