import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import { VaultClawback } from '../../src/models/transactions'
import { validateVaultClawback } from '../../src/models/transactions/vaultClawback'

/**
 * VaultClawback Transaction Verification Testing.
 *
 * Provides runtime verification testing for VaultClawback transaction type.
 */
describe('VaultClawback', function () {
  let tx: VaultClawback

  beforeEach(function () {
    tx = {
      TransactionType: 'VaultClawback',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      VaultID: 'ABCDEF1234567890',
      Holder: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Amount: {
        currency: 'USD',
        issuer: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
        value: '1234',
      },
    }
  })

  it('verifies valid VaultClawback', function () {
    assert.doesNotThrow(() => validateVaultClawback(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ missing VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = undefined
    const errorMessage = 'VaultClawback: missing field VaultID'
    assert.throws(
      () => validateVaultClawback(tx),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ invalid VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = 123
    const errorMessage = 'VaultClawback: invalid field VaultID'
    assert.throws(
      () => validateVaultClawback(tx),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ missing Holder', function () {
    // @ts-expect-error for test
    tx.Holder = undefined
    const errorMessage = 'VaultClawback: missing field Holder'
    assert.throws(
      () => validateVaultClawback(tx),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ invalid Holder', function () {
    // @ts-expect-error for test
    tx.Holder = 123
    const errorMessage = 'VaultClawback: invalid field Holder'
    assert.throws(
      () => validateVaultClawback(tx),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ string Amount', function () {
    // @ts-expect-error for test
    tx.Amount = '123456'
    const errorMessage = 'VaultClawback: invalid field Amount'
    assert.throws(
      () => validateVaultClawback(tx),
      ValidationError,
      errorMessage,
    )
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
