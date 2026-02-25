import { validateVaultDeposit } from '../../src/models/transactions/vaultDeposit'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateVaultDeposit)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateVaultDeposit, message)

/**
 * VaultDeposit Transaction Verification Testing.
 *
 * Provides runtime verification testing for VaultDeposit transaction type.
 */
describe('VaultDeposit', function () {
  let tx: any

  beforeEach(function () {
    tx = {
      TransactionType: 'VaultDeposit',
      Account: 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8',
      VaultID: 'ABCDEF1234567890',
      Amount: '1234.567',
    }
  })

  it('verifies valid VaultDeposit', function () {
    assertValid(tx)
  })

  it('throws w/ missing VaultID', function () {
    tx.VaultID = undefined
    assertInvalid(tx, 'VaultDeposit: missing field VaultID')
  })

  it('throws w/ invalid VaultID', function () {
    tx.VaultID = 123
    assertInvalid(
      tx,
      'VaultDeposit: invalid field VaultID, expected a valid hex string',
    )
  })

  it('throws w/ missing Amount', function () {
    tx.Amount = undefined
    assertInvalid(tx, 'VaultDeposit: missing field Amount')
  })

  it('throws w/ non-string Amount', function () {
    tx.Amount = 123
    assertInvalid(
      tx,
      'VaultDeposit: invalid field Amount, expected a valid Amount',
    )
  })
})
