import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { VaultDeposit } from '../../src/models/transactions'
import { validateVaultDeposit } from '../../src/models/transactions/vaultDeposit'

/**
 * VaultDeposit Transaction Verification Testing.
 *
 * Provides runtime verification testing for VaultDeposit transaction type.
 */
describe('VaultDeposit', function () {
  let tx: VaultDeposit

  beforeEach(function () {
    tx = {
      TransactionType: 'VaultDeposit',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      VaultID: 'ABCDEF1234567890',
      Amount: '1234.567',
    }
  })

  it('verifies valid VaultDeposit', function () {
    assert.doesNotThrow(() => validateVaultDeposit(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ missing VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = undefined
    const errorMessage = 'VaultDeposit: missing field VaultID'
    assert.throws(() => validateVaultDeposit(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ invalid VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = 123
    const errorMessage = 'VaultDeposit: invalid field VaultID'
    assert.throws(() => validateVaultDeposit(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ missing Amount', function () {
    // @ts-expect-error for test
    tx.Amount = undefined
    const errorMessage = 'VaultDeposit: missing field Amount'
    assert.throws(() => validateVaultDeposit(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ non-string Amount', function () {
    // @ts-expect-error for test
    tx.Amount = 123
    const errorMessage = 'VaultDeposit: invalid field Amount'
    assert.throws(() => validateVaultDeposit(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
