import { VaultClawback } from '../../src/models/transactions'
import { validateVaultClawback } from '../../src/models/transactions/vaultClawback'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateVaultClawback)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateVaultClawback, message)

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
    assertValid(tx)
  })

  it('throws w/ missing VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = undefined
    assertInvalid(tx, 'VaultClawback: missing field VaultID')
  })

  it('throws w/ invalid VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = 123
    assertInvalid(tx, 'VaultClawback: invalid field VaultID')
  })

  it('throws w/ missing Holder', function () {
    // @ts-expect-error for test
    tx.Holder = undefined
    assertInvalid(tx, 'VaultClawback: missing field Holder')
  })

  it('throws w/ invalid Holder', function () {
    // @ts-expect-error for test
    tx.Holder = 123
    assertInvalid(tx, 'VaultClawback: invalid field Holder')
  })

  it('throws w/ string Amount', function () {
    // @ts-expect-error for test
    tx.Amount = '123456'
    assertInvalid(tx, 'VaultClawback: invalid field Amount')
  })
})
