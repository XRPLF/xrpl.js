import { BeneficiarySet } from '../../src/models/transactions'
import {
  MAX_BENEFICIARY_TIME_LOCK,
  validateBeneficiarySet,
} from '../../src/models/transactions/beneficiarySet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateBeneficiarySet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateBeneficiarySet, message)

const ACCOUNT = 'rfmDuhDyLGgx94qiwf3YF8BUV5j6KSvE8'
const BENEFICIARY = 'rEhh6f9rj5UUBhFzGGaxS5zYU2CCqKFXBC'
const ZERO_ACCOUNT = 'rrrrrrrrrrrrrrrrrrrrrhoLvTp'
const TEN_YEARS_IN_SECONDS = 315360000
const ONE_DAY_IN_SECONDS = 86400

/**
 * BeneficiarySet Transaction Verification Testing.
 *
 * Providing runtime verification testing for each specific transaction type.
 */
describe('BeneficiarySet', function () {
  let tx: BeneficiarySet

  beforeEach(function () {
    tx = {
      TransactionType: 'BeneficiarySet',
      Account: ACCOUNT,
      Beneficiary: BENEFICIARY,
      TimeLock: ONE_DAY_IN_SECONDS,
    }
  })

  it('verifies valid BeneficiarySet that designates a beneficiary', function () {
    assertValid(tx)
  })

  it('verifies valid BeneficiarySet that clears the beneficiary', function () {
    delete tx.Beneficiary
    delete tx.TimeLock
    assertValid(tx)
  })

  it('verifies TimeLock at its bounds', function () {
    tx.TimeLock = 1
    assertValid(tx)

    tx.TimeLock = MAX_BENEFICIARY_TIME_LOCK
    assertValid(tx)
  })

  it('sets the TimeLock maximum to ten years in seconds', function () {
    expect(MAX_BENEFICIARY_TIME_LOCK).toBe(TEN_YEARS_IN_SECONDS)
  })

  it('throws w/ invalid Beneficiary', function () {
    // @ts-expect-error for test
    tx.Beneficiary = 123
    assertInvalid(tx, 'BeneficiarySet: invalid field Beneficiary')

    tx.Beneficiary = 'not-an-address'
    assertInvalid(tx, 'BeneficiarySet: invalid field Beneficiary')
  })

  it('throws w/ invalid TimeLock', function () {
    // @ts-expect-error for test
    tx.TimeLock = '86400'
    assertInvalid(tx, 'BeneficiarySet: invalid field TimeLock')
  })

  it('throws w/ Beneficiary without TimeLock', function () {
    delete tx.TimeLock
    assertInvalid(
      tx,
      'BeneficiarySet: Beneficiary and TimeLock must both be present or both be absent',
    )
  })

  it('throws w/ TimeLock without Beneficiary', function () {
    delete tx.Beneficiary
    assertInvalid(
      tx,
      'BeneficiarySet: Beneficiary and TimeLock must both be present or both be absent',
    )
  })

  it('throws w/ Beneficiary equal to Account', function () {
    tx.Beneficiary = ACCOUNT
    assertInvalid(tx, 'BeneficiarySet: Beneficiary must not be the Account')
  })

  it('throws w/ Beneficiary equal to Account as an X-address', function () {
    tx.Beneficiary = 'X7TviWU5CBaTMzaWiPKt1KE3qKFdzANQk8JNXYAjL8fVZsP'
    assertInvalid(tx, 'BeneficiarySet: Beneficiary must not be the Account')
  })

  it('throws w/ Beneficiary as the zero account', function () {
    tx.Beneficiary = ZERO_ACCOUNT
    assertInvalid(
      tx,
      'BeneficiarySet: Beneficiary must not be the zero account',
    )
  })

  it('throws w/ TimeLock of zero', function () {
    tx.TimeLock = 0
    assertInvalid(
      tx,
      `BeneficiarySet: TimeLock must be an integer from 1 to ${TEN_YEARS_IN_SECONDS}`,
    )
  })

  it('throws w/ TimeLock above the maximum', function () {
    tx.TimeLock = TEN_YEARS_IN_SECONDS + 1
    assertInvalid(
      tx,
      `BeneficiarySet: TimeLock must be an integer from 1 to ${TEN_YEARS_IN_SECONDS}`,
    )
  })

  it('throws w/ non-integer TimeLock', function () {
    tx.TimeLock = 1.5
    assertInvalid(
      tx,
      `BeneficiarySet: TimeLock must be an integer from 1 to ${TEN_YEARS_IN_SECONDS}`,
    )
  })
})
