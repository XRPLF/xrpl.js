import { validateLoanSet } from '../../src/models/transactions/loanSet'
import {
  assertTxIsValid,
  assertTxValidationError,
  generateInterfaceTypeTests,
} from '../testUtils'

const assertValid = (tx: any): void => assertTxIsValid(tx, validateLoanSet)
const assertInvalid = (tx: any, message: string): void =>
  assertTxValidationError(tx, validateLoanSet, message)

/**
 * LoanSet Transaction Verification Testing.
 */
describe('LoanSet', function () {
  const BASE: Record<string, unknown> = {
    Account: 'rf1BiGeXwwQoi8Z2ueFYTEXSwuJYfV2Jpn',
    TransactionType: 'LoanSet',
    LoanBrokerID: 'A'.repeat(64),
    PrincipalRequested: '1000',
  }

  it('validates a valid LoanSet', function () {
    assertValid(BASE)
  })

  // Auto-generated pure type-check tests (required + optional fields)
  describe('field type checks', function () {
    generateInterfaceTypeTests(
      { txType: 'LoanSet', validateFn: validateLoanSet, baseTx: BASE },
      { fileName: 'loanSet.ts', interfaceName: 'LoanSet' },
    )
  })

  // --- Semantic constraint tests ---

  it('throws w/ non-hex LoanBrokerID', function () {
    assertInvalid(
      { ...BASE, LoanBrokerID: 'not-valid-hex' },
      'LoanSet: LoanBrokerID must be 64 characters hexadecimal string',
    )
  })

  it('throws w/ LoanBrokerID wrong length', function () {
    assertInvalid(
      { ...BASE, LoanBrokerID: 'ABCD' },
      'LoanSet: LoanBrokerID must be 64 characters hexadecimal string',
    )
  })

  it('throws w/ invalid Data hex format', function () {
    assertInvalid(
      { ...BASE, Data: 'not-hex' },
      'LoanSet: Data must be a valid non-empty hex string up to 512 characters',
    )
  })

  it('throws w/ OverpaymentFee below 0', function () {
    assertInvalid(
      { ...BASE, OverpaymentFee: -1 },
      'LoanSet: OverpaymentFee must be between 0 and 100000 inclusive',
    )
  })

  it('throws w/ OverpaymentFee above max', function () {
    assertInvalid(
      { ...BASE, OverpaymentFee: 100001 },
      'LoanSet: OverpaymentFee must be between 0 and 100000 inclusive',
    )
  })

  it('throws w/ InterestRate below 0', function () {
    assertInvalid(
      { ...BASE, InterestRate: -1 },
      'LoanSet: InterestRate must be between 0 and 100000 inclusive',
    )
  })

  it('throws w/ InterestRate above max', function () {
    assertInvalid(
      { ...BASE, InterestRate: 100001 },
      'LoanSet: InterestRate must be between 0 and 100000 inclusive',
    )
  })

  it('throws w/ LateInterestRate below 0', function () {
    assertInvalid(
      { ...BASE, LateInterestRate: -1 },
      'LoanSet: LateInterestRate must be between 0 and 100000 inclusive',
    )
  })

  it('throws w/ LateInterestRate above max', function () {
    assertInvalid(
      { ...BASE, LateInterestRate: 100001 },
      'LoanSet: LateInterestRate must be between 0 and 100000 inclusive',
    )
  })

  it('throws w/ CloseInterestRate below 0', function () {
    assertInvalid(
      { ...BASE, CloseInterestRate: -1 },
      'LoanSet: CloseInterestRate must be between 0 and 100000 inclusive',
    )
  })

  it('throws w/ CloseInterestRate above max', function () {
    assertInvalid(
      { ...BASE, CloseInterestRate: 100001 },
      'LoanSet: CloseInterestRate must be between 0 and 100000 inclusive',
    )
  })

  it('throws w/ OverpaymentInterestRate below 0', function () {
    assertInvalid(
      { ...BASE, OverpaymentInterestRate: -1 },
      'LoanSet: OverpaymentInterestRate must be between 0 and 100000 inclusive',
    )
  })

  it('throws w/ OverpaymentInterestRate above max', function () {
    assertInvalid(
      { ...BASE, OverpaymentInterestRate: 100001 },
      'LoanSet: OverpaymentInterestRate must be between 0 and 100000 inclusive',
    )
  })

  it('throws w/ PaymentInterval below minimum', function () {
    assertInvalid(
      { ...BASE, PaymentInterval: 59 },
      'LoanSet: PaymentInterval must be greater than or equal to 60',
    )
  })

  it('throws w/ GracePeriod greater than PaymentInterval', function () {
    assertInvalid(
      { ...BASE, PaymentInterval: 120, GracePeriod: 121 },
      'LoanSet: GracePeriod must not be greater than PaymentInterval',
    )
  })
})
