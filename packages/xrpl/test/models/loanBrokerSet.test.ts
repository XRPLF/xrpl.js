import { validateLoanBrokerSet } from '../../src/models/transactions/loanBrokerSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void =>
  assertTxIsValid(tx, validateLoanBrokerSet)

const assertInvalid = (tx: any, errorMessage: string): void =>
  assertTxValidationError(tx, validateLoanBrokerSet, errorMessage)

describe('unit test LoanBrokerSet', () => {
  let tx: any

  beforeEach(() => {
    tx = {
      TransactionType: 'LoanBrokerSet',
      VaultID:
        '000004D417A9CE049C9A71A62B004659B5F1AAAB1BEA1EFDE4E01EB3497FD999',
      LoanBrokerID:
        'E9A08C918E26407493CC4ADD381BA979CFEB7E440D0863B01FB31C231D167E42',
      Data: 'ABCD',
      ManagementFeeRate: 500,
      DebtMaximum: '10e10',
      CoverRateMinimum: 50,
      CoverRateLiquidation: 20,
      Account: 'rPGxCzMicNJRe1U1CD5QyNjXdLUtdgSa7B',
    }
  })

  test('valid tx', () => {
    assertValid(tx)
  })

  test('incorrect VaultID', () => {
    tx.VaultID = 'INCORRECT_VALUE'
    assertInvalid(
      tx,
      'LoanBrokerSet: VaultID must be 64 characters hexadecimal string',
    )

    delete tx.VaultID
    assertInvalid(tx, 'LoanBrokerSet: missing field VaultID')
  })

  test('incorrect LoanBrokerID', () => {
    tx.LoanBrokerID = 'INCORRECT_VALUE'
    assertInvalid(
      tx,
      'LoanBrokerSet: LoanBrokerID must be 64 characters hexadecimal string',
    )
  })

  test('incorrect Data', () => {
    tx.Data = 'INCORRECT_VALUE'
    assertInvalid(
      tx,
      'LoanBrokerSet: Data must be a valid non-empty hex string up to 512 characters',
    )

    tx.Data = ''
    assertInvalid(
      tx,
      'LoanBrokerSet: Data must be a valid non-empty hex string up to 512 characters',
    )

    tx.Data = 'A'.repeat(513)
    assertInvalid(
      tx,
      'LoanBrokerSet: Data must be a valid non-empty hex string up to 512 characters',
    )
  })

  test('incorrect ManagementFeeRate', () => {
    tx.ManagementFeeRate = 123324
    assertInvalid(
      tx,
      'LoanBrokerSet: ManagementFeeRate must be between 0 and 10000 inclusive',
    )
  })

  test('incorrect DebtMaximum', () => {
    tx.DebtMaximum = '-1e10'
    assertInvalid(tx, 'LoanBrokerSet: DebtMaximum must be a non-negative value')
  })

  test('incorrect CoverRateMinimum', () => {
    tx.CoverRateMinimum = 12323487
    assertInvalid(
      tx,
      'LoanBrokerSet: CoverRateMinimum must be between 0 and 100000 inclusive',
    )
  })

  test('incorrect CoverRateLiquidation', () => {
    tx.CoverRateLiquidation = 12323487
    assertInvalid(
      tx,
      'LoanBrokerSet: CoverRateLiquidation must be between 0 and 100000 inclusive',
    )
  })

  test('CoverRateMinimum and CoverRateLiquidation both zero', () => {
    tx.CoverRateMinimum = 0
    tx.CoverRateLiquidation = 0
    assertValid(tx)
  })

  test('CoverRateMinimum and CoverRateLiquidation both non-zero', () => {
    tx.CoverRateMinimum = 10
    tx.CoverRateLiquidation = 20
    assertValid(tx)
  })

  test('CoverRateMinimum is zero and CoverRateLiquidation is non-zero', () => {
    tx.CoverRateMinimum = 0
    tx.CoverRateLiquidation = 10
    assertInvalid(
      tx,
      'LoanBrokerSet: CoverRateMinimum and CoverRateLiquidation must both be zero or both be non-zero',
    )
  })

  test('CoverRateMinimum is non-zero and CoverRateLiquidation is zero', () => {
    tx.CoverRateMinimum = 10
    tx.CoverRateLiquidation = 0
    assertInvalid(
      tx,
      'LoanBrokerSet: CoverRateMinimum and CoverRateLiquidation must both be zero or both be non-zero',
    )
  })
})
