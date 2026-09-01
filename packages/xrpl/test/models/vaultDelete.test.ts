import { stringToHex } from '@xrplf/isomorphic/utils'

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

  it('verifies valid VaultDelete with MemoData', function () {
    tx.MemoData = stringToHex('A'.repeat(256))
    assertValid(tx)
  })

  it('throws w/ MemoData not hex', function () {
    tx.MemoData = 'zznothex'
    assertInvalid(tx, 'VaultDelete: MemoData must be a valid hex string')
  })

  it('throws w/ MemoData too large', function () {
    tx.MemoData = stringToHex('A'.repeat(257))
    assertInvalid(tx, 'VaultDelete: MemoData must be less than 256 bytes')
  })

  it('throws w/ non-string MemoData', function () {
    // @ts-expect-error for test
    tx.MemoData = 123
    assertInvalid(tx, 'VaultDelete: invalid field MemoData')
  })
})
