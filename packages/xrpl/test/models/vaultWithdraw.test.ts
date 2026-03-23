import { assert } from 'chai'

import { validate } from '../../src'
import { VaultWithdraw } from '../../src/models/transactions'
import { validateVaultWithdraw } from '../../src/models/transactions/vaultWithdraw'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateVaultWithdraw)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateVaultWithdraw, message)

/**
 * VaultWithdraw Transaction Verification Testing.
 *
 * Provides runtime verification testing for VaultWithdraw transaction type.
 */
describe('VaultWithdraw', function () {
  let tx: VaultWithdraw

  beforeEach(function () {
    tx = {
      TransactionType: 'VaultWithdraw',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      VaultID: 'ABCDEF1234567890',
      Amount: '1234.567',
    }
  })

  it('verifies valid VaultWithdraw', function () {
    assertValid(tx)
  })

  it('throws w/ missing VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = undefined
    assertInvalid(tx, 'VaultWithdraw: missing field VaultID')
  })

  it('throws w/ invalid VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = 123
    assertInvalid(tx, 'VaultWithdraw: invalid field VaultID')
  })

  it('throws w/ missing Amount', function () {
    // @ts-expect-error for test
    tx.Amount = undefined
    assertInvalid(tx, 'VaultWithdraw: missing field Amount')
  })

  it('throws w/ non-string Amount', function () {
    // @ts-expect-error for test
    tx.Amount = 123
    assertInvalid(tx, 'VaultWithdraw: invalid field Amount')
  })

  it('verifies valid VaultWithdraw with Destination', function () {
    tx.Destination = 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8'
    assert.doesNotThrow(() => validateVaultWithdraw(tx))
    assert.doesNotThrow(() => validate(tx))
    assertValid(tx)
  })

  it('throws w/ invalid Destination', function () {
    // @ts-expect-error for test
    tx.Destination = 123
    assertInvalid(tx, 'VaultWithdraw: invalid field Destination')
  })
})
