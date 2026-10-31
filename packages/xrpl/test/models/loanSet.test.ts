import { LoanSetFlags } from '../../src'
import { validateLoanSet } from '../../src/models/transactions/loanSet'
import { assertTxIsValid, assertTxValidationError } from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateLoanSet)

const assertInvalid = (tx: any, errorMessage: string): void =>
  assertTxValidationError(tx, validateLoanSet, errorMessage)

const UINT32_FIELDS = [
  'OverpaymentFee',
  'InterestRate',
  'LateInterestRate',
  'CloseInterestRate',
  'OverpaymentInterestRate',
  'PaymentTotal',
  'PaymentInterval',
  'GracePeriod',
]

describe('unit test LoanSet', () => {
  let tx: any

  beforeEach(() => {
    tx = {
      TransactionType: 'LoanSet',
      Account: 'rPGxCzMicNJRe1U1CD5QyNjXdLUtdgSa7B',
      Counterparty: 'rp7Tj3Uu1RDrDd1tusge3bVBhUjNvzD19Y',
      LoanBrokerID:
        'E9A08C918E26407493CC4ADD381BA979CFEB7E440D0863B01FB31C231D167E42',
      PrincipalRequested: '100000',
      LoanOriginationFee: '100',
      LoanServiceFee: '10',
      LatePaymentFee: '20',
      ClosePaymentFee: '30',
      OverpaymentFee: 100,
      InterestRate: 500,
      LateInterestRate: 1000,
      CloseInterestRate: 200,
      OverpaymentInterestRate: 300,
      PaymentTotal: 12,
      PaymentInterval: 2592000,
      GracePeriod: 604800,
      Data: 'ABCD',
    }
  })

  test('valid tx', () => {
    assertValid(tx)
  })

  test('valid tx with only required fields', () => {
    assertValid({
      TransactionType: 'LoanSet',
      Account: tx.Account,
      LoanBrokerID: tx.LoanBrokerID,
      PrincipalRequested: tx.PrincipalRequested,
    })
  })

  test('valid tx with Flags as a number or an object', () => {
    tx.Flags = LoanSetFlags.tfLoanOverpayment
    assertValid(tx)

    tx.Flags = { tfLoanOverpayment: true }
    assertValid(tx)
  })

  test('incorrect LoanBrokerID', () => {
    tx.LoanBrokerID = 'INCORRECT_VALUE'
    assertInvalid(
      tx,
      'LoanSet: LoanBrokerID must be 64 characters hexadecimal string',
    )

    delete tx.LoanBrokerID
    assertInvalid(tx, 'LoanSet: missing field LoanBrokerID')
  })

  test('incorrect PrincipalRequested', () => {
    tx.PrincipalRequested = 'abc'
    assertInvalid(tx, 'LoanSet: invalid field PrincipalRequested')

    delete tx.PrincipalRequested
    assertInvalid(tx, 'LoanSet: missing field PrincipalRequested')
  })

  test('PrincipalRequested not greater than 0', () => {
    tx.PrincipalRequested = '0'
    assertInvalid(tx, 'LoanSet: PrincipalRequested must be greater than 0')

    tx.PrincipalRequested = '-1'
    assertInvalid(tx, 'LoanSet: PrincipalRequested must be greater than 0')
  })

  test('incorrect Counterparty', () => {
    tx.Counterparty = 'INCORRECT_VALUE'
    assertInvalid(tx, 'LoanSet: invalid field Counterparty')
  })

  test('incorrect CounterpartySignature', () => {
    tx.CounterpartySignature = 'INCORRECT_VALUE'
    assertInvalid(tx, 'LoanSet: invalid field CounterpartySignature')
  })

  test('incorrect Data', () => {
    tx.Data = 'INCORRECT_VALUE'
    assertInvalid(
      tx,
      'LoanSet: Data must be a valid non-empty hex string up to 512 characters',
    )
  })

  test('negative LoanServiceFee, LatePaymentFee or ClosePaymentFee', () => {
    for (const field of [
      'LoanServiceFee',
      'LatePaymentFee',
      'ClosePaymentFee',
    ]) {
      tx[field] = '0'
      assertValid(tx)

      tx[field] = '-1'
      assertInvalid(tx, `LoanSet: ${field} must be greater than or equal to 0`)
      tx[field] = '1'
    }
  })

  test('LoanOriginationFee outside 0 to PrincipalRequested', () => {
    tx.LoanOriginationFee = '0'
    assertValid(tx)

    tx.LoanOriginationFee = '100000'
    assertValid(tx)

    tx.PrincipalRequested = '1e5'
    tx.LoanOriginationFee = '1e5'
    assertValid(tx)

    tx.LoanOriginationFee = '100001'
    assertInvalid(
      tx,
      'LoanSet: LoanOriginationFee must be between 0 and PrincipalRequested inclusive',
    )

    tx.LoanOriginationFee = '-1'
    assertInvalid(
      tx,
      'LoanSet: LoanOriginationFee must be between 0 and PrincipalRequested inclusive',
    )
  })

  test('rate fields above their maximum', () => {
    for (const field of [
      'OverpaymentFee',
      'InterestRate',
      'LateInterestRate',
      'CloseInterestRate',
      'OverpaymentInterestRate',
    ]) {
      tx[field] = 100000
      assertValid(tx)

      tx[field] = 100001
      assertInvalid(
        tx,
        `LoanSet: ${field} must be between 0 and 100000 inclusive`,
      )
      tx[field] = 0
    }
  })

  test('UInt32 fields that are not a UInt32', () => {
    for (const field of UINT32_FIELDS) {
      const valid = tx[field]
      for (const value of [1.5, NaN, Infinity, -1, 2 ** 32, '12']) {
        tx[field] = value
        assertInvalid(tx, `LoanSet: invalid field ${field}`)
      }
      tx[field] = valid
    }
  })

  test('PaymentTotal not greater than 0', () => {
    tx.PaymentTotal = 0
    assertInvalid(tx, 'LoanSet: PaymentTotal must be greater than 0')
  })

  test('PaymentInterval below 60', () => {
    tx.GracePeriod = 59
    tx.PaymentInterval = 59
    assertInvalid(
      tx,
      'LoanSet: PaymentInterval must be greater than or equal to 60',
    )
  })

  test('GracePeriod outside 60 to PaymentInterval', () => {
    const errorMessage =
      'LoanSet: GracePeriod must be between 60 and PaymentInterval (60 if omitted) inclusive'

    tx.PaymentInterval = 120
    tx.GracePeriod = 60
    assertValid(tx)
    tx.GracePeriod = 120
    assertValid(tx)

    tx.GracePeriod = 59
    assertInvalid(tx, errorMessage)
    tx.GracePeriod = 121
    assertInvalid(tx, errorMessage)

    // Without PaymentInterval, rippled uses its default of 60
    delete tx.PaymentInterval
    tx.GracePeriod = 60
    assertValid(tx)
    tx.GracePeriod = 61
    assertInvalid(tx, errorMessage)
  })
})
