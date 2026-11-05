import { RepoDefault } from '../../src/models/transactions'
import { validateRepoDefault } from '../../src/models/transactions/repoDefault'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateRepoDefault)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateRepoDefault, message)

/**
 * RepoDefault Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('RepoDefault', function () {
  let tx: RepoDefault

  beforeEach(function () {
    tx = {
      TransactionType: 'RepoDefault',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      RepoID:
        'DB303FC1C7611B22C09E773B51044F6BEA02EF917DF59A2E2860871E167066A5',
    }
  })

  it('verifies valid RepoDefault', function () {
    assertValid(tx)
  })

  it('throws w/ missing RepoID', function () {
    // @ts-expect-error for test
    tx.RepoID = undefined
    assertInvalid(tx, 'RepoDefault: missing field RepoID')
  })

  it('throws w/ invalid RepoID', function () {
    tx.RepoID = 'ABCDEF'
    assertInvalid(tx, 'RepoDefault: invalid field RepoID')
  })

  it('throws w/ an unknown flag', function () {
    tx.Flags = 0x00000001
    assertInvalid(tx, 'RepoDefault: invalid Flags')
  })
})
