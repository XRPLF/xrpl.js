import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { VaultDelete } from '../../src/models/transactions'
import { validateVaultDelete } from '../../src/models/transactions/vaultDelete'

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
    assert.doesNotThrow(() => validateVaultDelete(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ missing VaultID', function () {
    // @ts-expect-error for test
    delete tx.VaultID
    const errorMessage = 'VaultDelete: missing field VaultID'
    assert.throws(() => validateVaultDelete(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ invalid VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = 123
    const errorMessage = 'VaultDelete: invalid field VaultID'
    assert.throws(() => validateVaultDelete(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
