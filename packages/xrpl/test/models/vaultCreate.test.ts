import { stringToHex } from '@xrplf/isomorphic/utils'
import { assert } from 'chai'

import { validate, ValidationError } from '../../src'
import {
  VaultCreate,
  VaultCreateFlags,
  VaultWithdrawalPolicy,
} from '../../src/models/transactions'
import { validateVaultCreate } from '../../src/models/transactions/vaultCreate'

/**
 * VaultCreate Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('VaultCreate', function () {
  let tx: VaultCreate

  beforeEach(function () {
    tx = {
      TransactionType: 'VaultCreate',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      Asset: { currency: 'XRP' },
      WithdrawalPolicy: VaultWithdrawalPolicy.vaultStrategyFirstComeFirstServe,
    }
  })

  it('verifies valid VaultCreate', function () {
    assert.doesNotThrow(() => validateVaultCreate(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ missing Asset', function () {
    // @ts-expect-error for test
    delete tx.Asset
    const errorMessage = 'VaultCreate: missing field Asset'
    assert.throws(() => validateVaultCreate(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ invalid Asset', function () {
    // @ts-expect-error for test
    tx.Asset = 123
    const errorMessage = 'VaultCreate: invalid field Asset'
    assert.throws(() => validateVaultCreate(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ Data field not hex', function () {
    tx.Data = 'zznothex'
    const errorMessage = 'VaultCreate: Data must be a valid hex string'
    assert.throws(() => validateVaultCreate(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ Data field too large', function () {
    tx.Data = stringToHex('a'.repeat(257))
    const errorMessage = 'VaultCreate: Data exceeds 256 bytes (actual: 257)'
    assert.throws(() => validateVaultCreate(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ negative AssetsMaximum', function () {
    tx.AssetsMaximum = BigInt(-1)
    const errorMessage = 'VaultCreate: AssetsMaximum cannot be negative.'
    assert.throws(() => validateVaultCreate(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ MPTokenMetadata not hex', function () {
    tx.MPTokenMetadata = 'ggnothex'
    const errorMessage =
      'VaultCreate: MPTokenMetadata must be a valid hex string'
    assert.throws(() => validateVaultCreate(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ MPTokenMetadata field too large', function () {
    tx.MPTokenMetadata = stringToHex('a'.repeat(1025))
    const errorMessage =
      'VaultCreate: MPTokenMetadata exceeds 1024 bytes (actual: 1025)'
    assert.throws(() => validateVaultCreate(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ missing WithdrawalPolicy', function () {
    delete tx.WithdrawalPolicy
    const errorMessage =
      'VaultCreate: WithdrawalPolicy is required. Set the default value (1) or use autofill to apply it.'
    assert.throws(() => validateVaultCreate(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('throws w/ non-number WithdrawalPolicy', function () {
    // @ts-expect-error for test
    tx.WithdrawalPolicy = 'invalid'
    const errorMessage = 'VaultCreate: invalid field WithdrawalPolicy'
    assert.throws(() => validateVaultCreate(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })

  it('allows DomainID when tfVaultPrivate flag set', function () {
    tx.DomainID = 'ABCDEF1234567890'
    tx.Flags = VaultCreateFlags.tfVaultPrivate
    assert.doesNotThrow(() => validateVaultCreate(tx))
    assert.doesNotThrow(() => validate(tx))
  })

  it('throws w/ DomainID set but tfVaultPrivate flag missing', function () {
    tx.DomainID = 'ABCDEF1234567890'
    tx.Flags = 0
    const errorMessage =
      'VaultCreate: Cannot set DomainID unless tfVaultPrivate flag is set.'
    assert.throws(() => validateVaultCreate(tx), ValidationError, errorMessage)
    assert.throws(() => validate(tx), ValidationError, errorMessage)
  })
})
