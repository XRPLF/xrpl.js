import { VaultDelete } from '../../src/models/transactions'
import { validateVaultDelete } from '../../src/models/transactions/vaultDelete'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateVaultDelete)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateVaultDelete, message)

/**
 * VaultDelete Transaction Verification Testing.
 *
 * Provides runtime verification testing for VaultDelete transaction type.
 */
describe('VaultDelete', function () {
  let tx: VaultDelete

  beforeEach(function () {
    tx = {
      TransactionType: 'VaultDelete',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      VaultID: 'ABCDEF1234567890',
    }
  })

  it('verifies valid VaultDelete', function () {
    assertValid(tx)
  })

  it('throws w/ missing VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = undefined
    assertInvalid(tx, 'VaultDelete: missing field VaultID')
  })

  it('throws w/ invalid VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = 123
    assertInvalid(tx, 'VaultDelete: invalid field VaultID')
  })
})
