import { MarginDeposit } from '../../src/models/transactions'
import {
  MarginDepositFlags,
  validateMarginDeposit,
} from '../../src/models/transactions/marginDeposit'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateMarginDeposit)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateMarginDeposit, message)

/**
 * MarginDeposit Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('MarginDeposit', function () {
  let tx: MarginDeposit

  beforeEach(function () {
    tx = {
      TransactionType: 'MarginDeposit',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ExchangeID:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
      Amount: {
        currency: 'USD',
        issuer: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
        value: '1000',
      },
    }
  })

  it('verifies valid MarginDeposit', function () {
    assertValid(tx)
  })

  it('verifies valid MarginDeposit w/ tfPerpCover', function () {
    tx.Flags = MarginDepositFlags.tfPerpCover
    assertValid(tx)
  })

  it('throws w/ missing ExchangeID', function () {
    // @ts-expect-error for test
    tx.ExchangeID = undefined
    assertInvalid(tx, 'MarginDeposit: missing field ExchangeID')
  })

  it('throws w/ missing Amount', function () {
    // @ts-expect-error for test
    tx.Amount = undefined
    assertInvalid(tx, 'MarginDeposit: missing field Amount')
  })

  it('throws w/ invalid Amount', function () {
    // @ts-expect-error for test
    tx.Amount = 1000
    assertInvalid(tx, 'MarginDeposit: invalid field Amount')
  })
})
