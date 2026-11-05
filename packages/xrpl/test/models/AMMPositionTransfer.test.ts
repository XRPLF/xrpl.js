import { AMMPositionTransfer } from '../../src/models/transactions'
import { validateAMMPositionTransfer } from '../../src/models/transactions/AMMPositionTransfer'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateAMMPositionTransfer)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateAMMPositionTransfer, message)

/**
 * AMMPositionTransfer Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('AMMPositionTransfer', function () {
  let tx: AMMPositionTransfer

  beforeEach(function () {
    tx = {
      TransactionType: 'AMMPositionTransfer',
      Account: 'rWYkbWkCeg8dP6rXALnjgZSjjLyih5NXm',
      Destination: 'rPyfep3gcLzkosKC9XiE77Y8DZWG6iWDT9',
      PositionID:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
      Sequence: 1337,
    }
  })

  it('verifies valid AMMPositionTransfer', function () {
    assertValid(tx)
  })

  it('throws w/ missing Destination', function () {
    // @ts-expect-error for test
    tx.Destination = undefined
    assertInvalid(tx, 'AMMPositionTransfer: missing field Destination')
  })

  it('throws w/ invalid Destination', function () {
    // @ts-expect-error for test
    tx.Destination = 1234
    assertInvalid(tx, 'AMMPositionTransfer: invalid field Destination')
  })

  it('throws w/ missing PositionID', function () {
    // @ts-expect-error for test
    tx.PositionID = undefined
    assertInvalid(tx, 'AMMPositionTransfer: missing field PositionID')
  })

  it('throws w/ invalid PositionID', function () {
    tx.PositionID = 'ABCD'
    assertInvalid(tx, 'AMMPositionTransfer: invalid field PositionID')
  })

  it('throws w/ Destination equal to Account', function () {
    tx.Destination = tx.Account
    assertInvalid(
      tx,
      'AMMPositionTransfer: Destination and Account must be different',
    )
  })
})
