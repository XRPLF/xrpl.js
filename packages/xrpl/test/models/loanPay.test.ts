import {
  validateLoanPay,
  LoanPayFlags,
} from '../../src/models/transactions/loanPay'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateLoanPay)

const assertInvalid = (tx: any, errorMessage: string): void =>
  assertTxValidationError(tx, validateLoanPay, errorMessage)

describe('unit test LoanPay', () => {
  let tx: any

  beforeEach(() => {
    tx = {
      TransactionType: 'LoanPay',
      LoanID:
        '000004D417A9CE049C9A71A62B004659B5F1AAAB1BEA1EFDE4E01EB3497FD999',
      Amount: '1000000',
      Account: 'rPGxCzMicNJRe1U1CD5QyNjXdLUtdgSa7B',
    }
  })

  test('valid tx with no flags', () => {
    assertValid(tx)
  })

  test('valid tx with tfLoanOverpayment flag (numeric)', () => {
    tx.Flags = LoanPayFlags.tfLoanOverpayment
    assertValid(tx)
  })

  test('valid tx with tfLoanFullPayment flag (numeric)', () => {
    tx.Flags = LoanPayFlags.tfLoanFullPayment
    assertValid(tx)
  })

  test('valid tx with tfLoanLatePayment flag (numeric)', () => {
    tx.Flags = LoanPayFlags.tfLoanLatePayment
    assertValid(tx)
  })

  test('throws w/ multiple flags set (numeric) - tfLoanOverpayment and tfLoanFullPayment', () => {
    // eslint-disable-next-line no-bitwise -- testing flag combinations
    tx.Flags = LoanPayFlags.tfLoanOverpayment | LoanPayFlags.tfLoanFullPayment
    assertInvalid(
      tx,
      'LoanPay: Only one of tfLoanLatePayment, tfLoanFullPayment, or tfLoanOverpayment flags can be set',
    )
  })

  test('valid tx with tfLoanOverpayment flag (object)', () => {
    tx.Flags = { tfLoanOverpayment: true }
    assertValid(tx)
  })

  test('invalid tx with tfLoanFullPayment and tfLoanOverpayment flag (object)', () => {
    tx.Flags = { tfLoanFullPayment: true, tfLoanOverpayment: true }
    assertInvalid(
      tx,
      'LoanPay: Only one of tfLoanLatePayment, tfLoanFullPayment, or tfLoanOverpayment flags can be set',
    )
  })

  test('incorrect LoanID', () => {
    tx.LoanID = 'INCORRECT_VALUE'
    assertInvalid(
      tx,
      'LoanPay: LoanID must be 64 characters hexadecimal string',
    )

    delete tx.LoanID
    assertInvalid(tx, 'LoanPay: missing field LoanID')
  })

  test('missing Amount', () => {
    delete tx.Amount
    assertInvalid(tx, 'LoanPay: missing field Amount')
  })

  test('invalid Amount', () => {
    tx.Amount = 123
    assertInvalid(tx, 'LoanPay: invalid field Amount, expected a valid Amount')
  })
})
