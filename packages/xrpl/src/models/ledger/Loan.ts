import { Account, XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * A Loan ledger entry captures various Loan terms on-chain. It is an agreement between the Borrower and the loan issuer.
 *
 * @category Ledger Entries
 */
export default interface Loan extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Loan'

  /**
   * Ledger object flags.
   */
  Flags: number

  /**
   * The sequence number of the Loan.
   */
  LoanSequence: number

  /**
   * Identifies the page where this item is referenced in the Borrower owner's directory.
   */
  OwnerNode: string

  /**
   * Identifies the page where this item is referenced in the LoanBrokers owner's directory.
   */
  LoanBrokerNode: string

  /**
   * The ID of the LoanBroker associated with this Loan Instance.
   */
  LoanBrokerID: string

  /**
   * The address of the account that is the borrower.
   */
  Borrower: Account

  /**
   * A nominal fee amount paid to the LoanBroker.Owner when the Loan is created.
   */
  LoanOriginationFee?: XRPLNumber

  /**
   * A nominal funds amount paid to the LoanBroker.Owner with every Loan payment.
   */
  LoanServiceFee?: XRPLNumber

  /**
   * A nominal funds amount paid to the LoanBroker.Owner when a payment is late.
   */
  LatePaymentFee?: XRPLNumber

  /**
   * A nominal funds amount paid to the LoanBroker.Owner when a full payment is made.
   */
  ClosePaymentFee?: XRPLNumber

  /**
   * A fee charged on over-payments in 1/10th basis points. Valid values are between 0 and 100000 inclusive. (0 - 100%)
   */
  OverpaymentFee?: XRPLNumber

  /**
   * Annualized interest rate of the Loan in 1/10th basis points.
   */
  InterestRate?: number

  /**
   * A premium is added to the interest rate for late payments in 1/10th basis points.
   * Valid values are between 0 and 100000 inclusive. (0 - 100%)
   */
  LateInterestRate?: number

  /**
   * An interest rate charged for repaying the Loan early in 1/10th basis points.
   * Valid values are between 0 and 100000 inclusive. (0 - 100%)
   */
  CloseInterestRate?: number

  /**
   * An interest rate charged on over-payments in 1/10th basis points. Valid values are between 0 and 100000 inclusive. (0 - 100%)
   */
  OverpaymentInterestRate?: number

  /**
   * The timestamp of when the Loan started Ripple Epoch.
   */
  StartDate: number

  /**
   * Number of seconds between Loan payments.
   */
  PaymentInterval: number

  /**
   * The number of seconds after the Payment Due Date that the Loan can be Defaulted.
   */
  GracePeriod: number

  /**
   * The timestamp of when the previous payment was made in Ripple Epoch.
   */
  PreviousPaymentDate?: number

  /**
   * The timestamp of when the next payment is due in Ripple Epoch.
   */
  NextPaymentDueDate: number

  /**
   * The number of payments remaining on the Loan.
   */
  PaymentRemaining: number

  /**
   * The principal amount requested by the Borrower.
   */
  PrincipalOutstanding: XRPLNumber

  /**
   * The calculated periodic payment amount for each payment interval.
   */
  PeriodicPayment: XRPLNumber

  /**
   * The total outstanding value of the Loan, including all fees and interest.
   */
  TotalValueOutstanding: XRPLNumber
}

export enum LoanFlags {
  /**
   * If set, indicates that the Loan is defaulted.
   */
  lsfLoanDefault = 0x00010000,

  /**
   * If set, indicates that the Loan is impaired.
   */
  lsfLoanImpaired = 0x00020000,

  /**
   * If set, indicates that the Loan supports overpayments.
   */
  lsfLoanOverpayment = 0x00040000,
}
