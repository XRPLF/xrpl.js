import { BallotDelete } from '../../src/models/transactions'
import { validateBallotDelete } from '../../src/models/transactions/ballotDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateBallotDelete)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateBallotDelete, message)

/**
 * BallotDelete Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('BallotDelete', function () {
  let tx: BallotDelete

  beforeEach(function () {
    tx = {
      TransactionType: 'BallotDelete',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      BallotID:
        '983F536DBB46D5BBF43A0B5890576874EE1CF48CE31CA508A529EC17CD1A90EF',
    }
  })

  it('verifies valid BallotDelete', function () {
    assertValid(tx)
  })

  it('throws w/ unknown flags', function () {
    tx.Flags = 0x00010000
    assertInvalid(tx, 'BallotDelete: invalid Flags')
  })

  it('throws w/ missing BallotID', function () {
    // @ts-expect-error for test
    tx.BallotID = undefined
    assertInvalid(tx, 'BallotDelete: missing field BallotID')
  })

  it('throws w/ invalid BallotID', function () {
    tx.BallotID = 'ABCD'
    assertInvalid(tx, 'BallotDelete: invalid field BallotID')
  })

  it('throws w/ a zero BallotID', function () {
    tx.BallotID = '0'.repeat(64)
    assertInvalid(tx, 'BallotDelete: BallotID must not be zero')
  })
})
