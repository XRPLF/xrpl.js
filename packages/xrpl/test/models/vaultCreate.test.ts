import { stringToHex } from '@xrplf/isomorphic/utils'

import {
  VaultCreate,
  VaultCreateFlags,
  VaultWithdrawalPolicy,
} from '../../src/models/transactions'
import { validateVaultCreate } from '../../src/models/transactions/vaultCreate'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateVaultCreate)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateVaultCreate, message)

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
    assertValid(tx)
  })

  it('throws w/ missing Asset', function () {
    // @ts-expect-error for test
    tx.Asset = undefined
    assertInvalid(tx, 'VaultCreate: missing field Asset')
  })

  it('throws w/ invalid Asset', function () {
    // @ts-expect-error for test
    tx.Asset = 123
    assertInvalid(tx, 'VaultCreate: invalid field Asset')
  })

  it('throws w/ Data field not hex', function () {
    tx.Data = 'zznothex'
    assertInvalid(tx, 'VaultCreate: Data must be a valid hex string')
  })

  it('throws w/ Data field too large', function () {
    tx.Data = stringToHex('a'.repeat(257))
    assertInvalid(tx, 'VaultCreate: Data exceeds 256 bytes (actual: 257)')
  })

  it('throws w/ MPTokenMetadata not hex', function () {
    tx.MPTokenMetadata = 'ggnothex'
    assertInvalid(tx, 'VaultCreate: MPTokenMetadata must be a valid hex string')
  })

  it('throws w/ MPTokenMetadata field too large', function () {
    tx.MPTokenMetadata = stringToHex('a'.repeat(1025))
    assertInvalid(
      tx,
      'VaultCreate: MPTokenMetadata exceeds 1024 bytes (actual: 1025)',
    )
  })

  it('throws w/ non-number WithdrawalPolicy', function () {
    // @ts-expect-error for test
    tx.WithdrawalPolicy = 'invalid'
    assertInvalid(tx, 'VaultCreate: invalid field WithdrawalPolicy')
  })

  it('allows DomainID when tfVaultPrivate flag set', function () {
    tx.DomainID = 'ABCDEF1234567890'
    tx.Flags = VaultCreateFlags.tfVaultPrivate
    assertValid(tx)
  })

  it('throws w/ DomainID set but tfVaultPrivate flag missing', function () {
    tx.DomainID = 'ABCDEF1234567890'
    tx.Flags = 0
    assertInvalid(
      tx,
      'VaultCreate: Cannot set DomainID unless tfVaultPrivate flag is set.',
    )
  })
})
