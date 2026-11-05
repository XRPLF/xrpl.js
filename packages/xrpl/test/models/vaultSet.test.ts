import { stringToHex } from '@xrplf/isomorphic/utils'

import { VaultSet } from '../../src'
import { validateVaultSet } from '../../src/models/transactions/vaultSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateVaultSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateVaultSet, message)

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
    assertValid(tx)
  })

  it('throws w/ missing VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = undefined
    assertInvalid(tx, 'VaultSet: missing field VaultID')
  })

  it('throws w/ non-string VaultID', function () {
    // @ts-expect-error for test
    tx.VaultID = 123456
    assertInvalid(tx, 'VaultSet: invalid field VaultID')
  })

  it('throws w/ Data field not hex', function () {
    tx.Data = 'zznothex'
    assertInvalid(tx, 'VaultSet: Data must be a valid hex string')
  })

  it('throws w/ Data field too large', function () {
    tx.Data = stringToHex('a'.repeat(257))
    assertInvalid(tx, 'VaultSet: Data exceeds 256 bytes (actual: 257)')
  })

  it('throws w/ non-XRPLNumber AssetsMaximum', function () {
    tx.AssetsMaximum = 'notanumber'
    assertInvalid(tx, 'VaultSet: invalid field AssetsMaximum')
  })

  it('throws w/ non-string Data', function () {
    // @ts-expect-error for test
    tx.Data = 1234
    assertInvalid(tx, 'VaultSet: invalid field Data')
  })

  it('throws w/ non-string DomainID', function () {
    // @ts-expect-error for test
    tx.DomainID = 1234
    assertInvalid(tx, 'VaultSet: invalid field DomainID')
  })

  it(`throws w/ non-hex VaultID`, function () {
    tx.VaultID = 'not hex'
    assertInvalid(tx, 'VaultSet: invalid field VaultID')
  })

  it(`throws w/ non-hex DomainID`, function () {
    tx.DomainID = 'not hex'
    assertInvalid(tx, 'VaultSet: invalid field DomainID')
  })

  it('verifies VaultSet with DepositFee, RedemptionFee and RedemptionPeriod', function () {
    tx.DepositFee = 50000
    tx.RedemptionFee = 0
    tx.RedemptionPeriod = 86400
    assertValid(tx)
  })

  it('verifies VaultSet with RedemptionPeriod alone', function () {
    tx.RedemptionPeriod = 0
    assertValid(tx)
  })

  it('throws w/ DepositFee above the maximum', function () {
    tx.DepositFee = 50001
    assertInvalid(tx, 'VaultSet: DepositFee must be between 0 and 50000')
  })

  it('throws w/ RedemptionFee above the maximum', function () {
    tx.RedemptionFee = 50001
    assertInvalid(tx, 'VaultSet: RedemptionFee must be between 0 and 50000')
  })

  it('throws w/ non-number DepositFee', function () {
    // @ts-expect-error for test
    tx.DepositFee = '100'
    assertInvalid(tx, 'VaultSet: invalid field DepositFee')
  })

  it('throws w/ non-number RedemptionFee', function () {
    // @ts-expect-error for test
    tx.RedemptionFee = '100'
    assertInvalid(tx, 'VaultSet: invalid field RedemptionFee')
  })

  it('throws w/ non-number RedemptionPeriod', function () {
    // @ts-expect-error for test
    tx.RedemptionPeriod = '86400'
    assertInvalid(tx, 'VaultSet: invalid field RedemptionPeriod')
  })
})
