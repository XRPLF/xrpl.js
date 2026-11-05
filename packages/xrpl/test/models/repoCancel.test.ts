import { RepoCancel } from '../../src/models/transactions'
import { validateRepoCancel } from '../../src/models/transactions/repoCancel'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateRepoCancel)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateRepoCancel, message)

/**
 * RepoCancel Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('RepoCancel', function () {
  let tx: RepoCancel

  beforeEach(function () {
    tx = {
      TransactionType: 'RepoCancel',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      RepoID:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
    }
  })

  it('verifies valid RepoCancel', function () {
    assertValid(tx)
  })

  it('throws w/ missing RepoID', function () {
    // @ts-expect-error for test
    tx.RepoID = undefined
    assertInvalid(tx, 'RepoCancel: missing field RepoID')
  })

  it('throws w/ invalid RepoID', function () {
    tx.RepoID = 'ABCDEF'
    assertInvalid(tx, 'RepoCancel: invalid field RepoID')
  })

  it('throws w/ an unknown flag', function () {
    tx.Flags = 0x00000001
    assertInvalid(tx, 'RepoCancel: invalid Flags')
  })
})
