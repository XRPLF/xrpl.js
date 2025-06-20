import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import { validate, ValidationError, VaultSet } from '../../src'
import { validateVaultSet } from '../../src/models/transactions/vaultSet'

/**
 * VaultSet Transaction Verification Testing.
 *
 * Providing runtime verification testing for the VaultSet transaction type.
 */
describe('VaultSet', function () {
  let tx: VaultSet

  beforeEach(function () {
    tx = {
      TransactionType: 'VaultSet',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      VaultID: 'ABCDEF1234567890',
    }
  })

  it('verifies valid VaultSet', function () {
    assert.doesNotThrow(() => validateVaultSet(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ missing VaultID', function () {
    // @ts-expect-error for test
    delete tx.VaultID
    const errorMessage = 'VaultSet: missing field VaultID'
    assert.throws(() => validateVaultSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ non-string VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = 123456
    const errorMessage = 'VaultSet: invalid field VaultID'
    assert.throws(() => validateVaultSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ Data field not hex', function () {
    tx.Data = 'zznothex'
    const errorMessage = 'VaultSet: Data must be a valid hex string'
    assert.throws(() => validateVaultSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ Data field too large', function () {
    tx.Data = stringToHex('a'.repeat(257))
    const errorMessage = 'VaultSet: Data exceeds 256 bytes (actual: 257)'
    assert.throws(() => validateVaultSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ non-XRPLNumber AssetsMaximum', function () {
    tx.AssetsMaximum = 'notanumber'
    const errorMessage = 'VaultSet: invalid field AssetsMaximum'
    assert.throws(() => validateVaultSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ non-string Data', function () {
    // @ts-expect-error for test
    tx.Data = 1234
    const errorMessage = 'VaultSet: invalid field Data'
    assert.throws(() => validateVaultSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ non-string DomainID', function () {
    // @ts-expect-error for test
    tx.DomainID = 1234
    const errorMessage = 'VaultSet: invalid field DomainID'
    assert.throws(() => validateVaultSet(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
