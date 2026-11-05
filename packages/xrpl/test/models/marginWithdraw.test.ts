import { MarginWithdraw } from '../../src/models/transactions'
import {
  MarginWithdrawFlags,
  validateMarginWithdraw,
} from '../../src/models/transactions/marginWithdraw'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateMarginWithdraw)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateMarginWithdraw, message)

/**
 * MarginWithdraw Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('MarginWithdraw', function () {
  let tx: MarginWithdraw

  beforeEach(function () {
    tx = {
      TransactionType: 'MarginWithdraw',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      ExchangeID:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
      Amount: '1000000',
      Destination: 'rsA2LpzuawewSBQXkiju3YQTMzW13pAAdW',
    }
  })

  it('verifies valid MarginWithdraw', function () {
    assertValid(tx)
  })

  it('verifies valid MarginWithdraw w/ tfPerpDeleteAccount', function () {
    tx.Flags = MarginWithdrawFlags.tfPerpDeleteAccount
    assertValid(tx)
  })

  it('verifies valid MarginWithdraw w/ tfPerpOwnerFees', function () {
    tx.Flags = { tfPerpOwnerFees: true }
    assertValid(tx)
  })

  it('throws w/ missing ExchangeID', function () {
    // @ts-expect-error for test
    tx.ExchangeID = undefined
    assertInvalid(tx, 'MarginWithdraw: missing field ExchangeID')
  })

  it('throws w/ missing Amount', function () {
    // @ts-expect-error for test
    tx.Amount = undefined
    assertInvalid(tx, 'MarginWithdraw: missing field Amount')
  })

  it('throws w/ invalid Destination', function () {
    // @ts-expect-error for test
    tx.Destination = 7
    assertInvalid(tx, 'MarginWithdraw: invalid field Destination')
  })

  it('throws w/ tfPerpCover and tfPerpOwnerFees', function () {
    tx.Flags =
      MarginWithdrawFlags.tfPerpCover + MarginWithdrawFlags.tfPerpOwnerFees
    assertInvalid(
      tx,
      'MarginWithdraw: at most one of tfPerpCover, tfPerpOwnerFees and tfPerpDeleteAccount may be set',
    )
  })
})
