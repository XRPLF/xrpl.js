import { BallotFinalize } from '../../src/models/transactions'
import { validateBallotFinalize } from '../../src/models/transactions/ballotFinalize'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateBallotFinalize)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateBallotFinalize, message)

const BALLOT_ID =
  '983F536DBB46D5BBF43A0B5890576874EE1CF48CE31CA508A529EC17CD1A90EF'
// One 64-byte decryption-correctness proof per option.
const OPTION_PROOF = 'AB'.repeat(64)

function result(weight: string): { BallotResult: { BallotWeight: string } } {
  return { BallotResult: { BallotWeight: weight } }
}

/**
 * BallotFinalize Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('BallotFinalize', function () {
  let tx: BallotFinalize

  beforeEach(function () {
    tx = {
      TransactionType: 'BallotFinalize',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      BallotID: BALLOT_ID,
      Results: [result('0'), result('1F4')],
      ZKProof: OPTION_PROOF.repeat(2),
    }
  })

  it('verifies valid BallotFinalize', function () {
    assertValid(tx)
  })

  it('verifies valid BallotFinalize with 8 results', function () {
    tx.Results = Array.from({ length: 8 }, () => result('FFFFFFFFFFFFFFFF'))
    tx.ZKProof = OPTION_PROOF.repeat(8)
    assertValid(tx)
  })

  it('throws w/ unknown flags', function () {
    tx.Flags = 0x00010000
    assertInvalid(tx, 'BallotFinalize: invalid Flags')
  })

  it('throws w/ missing BallotID', function () {
    // @ts-expect-error for test
    tx.BallotID = undefined
    assertInvalid(tx, 'BallotFinalize: missing field BallotID')
  })

  it('throws w/ invalid BallotID', function () {
    tx.BallotID = 'ABCD'
    assertInvalid(tx, 'BallotFinalize: invalid field BallotID')
  })

  it('throws w/ missing Results', function () {
    // @ts-expect-error for test
    tx.Results = undefined
    assertInvalid(tx, 'BallotFinalize: missing field Results')
  })

  it('throws w/ non-array Results', function () {
    // @ts-expect-error for test
    tx.Results = result('1')
    assertInvalid(tx, 'BallotFinalize: invalid field Results')
  })

  it('throws w/ empty Results', function () {
    tx.Results = []
    assertInvalid(
      tx,
      'BallotFinalize: Results must have between 1 and 8 entries',
    )
  })

  it('throws w/ more than 8 Results', function () {
    tx.Results = Array.from({ length: 9 }, () => result('1'))
    tx.ZKProof = OPTION_PROOF.repeat(9)
    assertInvalid(
      tx,
      'BallotFinalize: Results must have between 1 and 8 entries',
    )
  })

  it('throws w/ a Results entry without BallotWeight', function () {
    // @ts-expect-error for test
    tx.Results = [result('1'), { BallotResult: {} }]
    assertInvalid(tx, 'BallotFinalize: invalid field Results')
  })

  it('throws w/ a Results entry that is not a BallotResult', function () {
    // @ts-expect-error for test
    tx.Results = [result('1'), { BallotWeight: '1' }]
    assertInvalid(tx, 'BallotFinalize: invalid field Results')
  })

  it('throws w/ a BallotWeight that is not a UInt64 hex string', function () {
    tx.Results = [result('1'), result('1FFFFFFFFFFFFFFFF')]
    assertInvalid(tx, 'BallotFinalize: invalid field Results')
    tx.Results = [result('1'), result('weight')]
    assertInvalid(tx, 'BallotFinalize: invalid field Results')
  })

  it('throws w/ missing ZKProof', function () {
    // @ts-expect-error for test
    tx.ZKProof = undefined
    assertInvalid(tx, 'BallotFinalize: missing field ZKProof')
  })

  it('throws w/ empty ZKProof', function () {
    tx.ZKProof = ''
    assertInvalid(tx, 'BallotFinalize: invalid field ZKProof')
  })

  it('throws w/ ZKProof that is not a whole number of option proofs', function () {
    tx.ZKProof = `${OPTION_PROOF.repeat(2)}AB`
    assertInvalid(
      tx,
      'BallotFinalize: ZKProof must hold one 64-byte proof per Results entry',
    )
  })

  it('throws w/ ZKProof holding a different number of proofs than Results', function () {
    tx.ZKProof = OPTION_PROOF.repeat(3)
    assertInvalid(
      tx,
      'BallotFinalize: ZKProof must hold one 64-byte proof per Results entry',
    )
  })
})
