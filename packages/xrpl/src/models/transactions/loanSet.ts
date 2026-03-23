import { ValidationError } from '../../errors'
import { Signer } from '../common'

import {
  BaseTransaction,
  validateHexMetadata,
  isLedgerEntryId,
  isNumber,
  isXRPLNumber,
  validateBaseTransaction,
  validateOptionalField,
  isString,
  validateRequiredField,
  XRPLNumber,
  GlobalFlagsInterface,
  Account,
  isAccount,
  isRecord,
} from './common'

const MAX_DATA_LENGTH = 512
const MAX_OVER_PAYMENT_FEE_RATE = 100_000
const MAX_INTEREST_RATE = 100_000
const MAX_LATE_INTEREST_RATE = 100_000
const MAX_CLOSE_INTEREST_RATE = 100_000
const MAX_OVER_PAYMENT_INTEREST_RATE = 100_000
const MIN_PAYMENT_INTERVAL = 60

/**
 * The transaction creates a new Loan object.
 *
 * @category Transaction Models
 */
export interface LoanSet extends BaseTransaction {
  TransactionType: 'LoanSet'

  /**
   * The Loan Broker ID associated with the loan.
   */
  LoanBrokerID: string

  /**
   * The principal amount requested by the Borrower.
   */
  PrincipalRequested: XRPLNumber

  /**
   * The signature of the counterparty over the transaction.
   */
  CounterpartySignature?: CounterpartySignature

  /**
   * The address of the counterparty of the Loan.
   */
  Counterparty?: Account

  /**
   * Arbitrary metadata in hex format. The field is limited to 512 characters.
   */
  Data?: string

  /**
   * A nominal funds amount paid to the LoanBroker.Owner when the Loan is created.
   */
  LoanOriginationFee?: XRPLNumber

  /**
   * A nominal amount paid to the LoanBroker.Owner with every Loan payment.
   */
  LoanServiceFee?: XRPLNumber

  /**
   * A nominal funds amount paid to the LoanBroker.Owner when a payment is late.
   */
  LatePaymentFee?: XRPLNumber

  /**
   * A nominal funds amount paid to the LoanBroker.Owner when an early full repayment is made.
   */
  ClosePaymentFee?: XRPLNumber

  /**
   * A fee charged on overpayments in 1/10th basis points. Valid values are between 0 and 100000 inclusive. (0 - 100%)
   */
  OverpaymentFee?: number

  /**
   * Annualized interest rate of the Loan in in 1/10th basis points. Valid values are between 0 and 100000 inclusive. (0 - 100%)
   */
  InterestRate?: number

  /**
   * A premium added to the interest rate for late payments in in 1/10th basis points.
   * Valid values are between 0 and 100000 inclusive. (0 - 100%)
   */
  LateInterestRate?: number

  /**
   * A Fee Rate charged for repaying the Loan early in 1/10th basis points.
   * Valid values are between 0 and 100000 inclusive. (0 - 100%)
   */
  CloseInterestRate?: number

  /**
   * An interest rate charged on over payments in 1/10th basis points. Valid values are between 0 and 100000 inclusive. (0 - 100%)
   */
  OverpaymentInterestRate?: number

  /**
   * The total number of payments to be made against the Loan.
   */
  PaymentTotal?: number

  /**
   * Number of seconds between Loan payments.
   */
  PaymentInterval?: number

  /**
   * The number of seconds after the Loan's Payment Due Date can be Defaulted.
   */
  GracePeriod?: number

  Flags?: number | LoanSetFlagsInterface
}

/**
 * An inner object that contains the signature of the Lender over the transaction.
 */
export interface CounterpartySignature {
  /**
   * The Public Key to be used to verify the validity of the signature.
   */
  SigningPubKey?: string

  /**
   * The signature of over all signing fields.
   */
  TxnSignature?: string

  /**
   * An array of transaction signatures from the Counterparty signers to indicate their approval of this transaction.
   */
  Signers?: Signer[]
}

/**
 * Transaction Flags for an LoanSet Transaction.
 *
 * @category Transaction Flags
 */
export enum LoanSetFlags {
  /**
   * Indicates that the loan supports over payments.
   */
  tfLoanOverpayment = 0x00010000,
}

/**
 * Map of flags to boolean values representing {@link LoanSet} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface LoanSetFlagsInterface extends GlobalFlagsInterface {
  tfLoanOverpayment?: boolean
}

/**
 * Verify the form and type of an LoanSet at runtime.
 *
 * @param tx - LoanSet Transaction.
 * @throws When LoanSet is Malformed.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- due to many validations
export function validateLoanSet(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'LoanBrokerID', isString)
  validateRequiredField(tx, 'PrincipalRequested', isXRPLNumber)
  validateOptionalField(tx, 'CounterpartySignature', isRecord)
  validateOptionalField(tx, 'Data', isString)
  validateOptionalField(tx, 'Counterparty', isAccount)
  validateOptionalField(tx, 'LoanOriginationFee', isXRPLNumber)
  validateOptionalField(tx, 'LoanServiceFee', isXRPLNumber)
  validateOptionalField(tx, 'LatePaymentFee', isXRPLNumber)
  validateOptionalField(tx, 'ClosePaymentFee', isXRPLNumber)
  validateOptionalField(tx, 'OverpaymentFee', isNumber)
  validateOptionalField(tx, 'InterestRate', isNumber)
  validateOptionalField(tx, 'LateInterestRate', isNumber)
  validateOptionalField(tx, 'CloseInterestRate', isNumber)
  validateOptionalField(tx, 'OverpaymentInterestRate', isNumber)
  validateOptionalField(tx, 'PaymentTotal', isNumber)
  validateOptionalField(tx, 'PaymentInterval', isNumber)
  validateOptionalField(tx, 'GracePeriod', isNumber)

  if (!isLedgerEntryId(tx.LoanBrokerID)) {
    throw new ValidationError(
      `LoanSet: LoanBrokerID must be 64 characters hexadecimal string`,
    )
  }

  if (tx.Data != null && !validateHexMetadata(tx.Data, MAX_DATA_LENGTH)) {
    throw new ValidationError(
      `LoanSet: Data must be a valid non-empty hex string up to ${MAX_DATA_LENGTH} characters`,
    )
  }

  if (
    tx.OverpaymentFee != null &&
    (tx.OverpaymentFee < 0 || tx.OverpaymentFee > MAX_OVER_PAYMENT_FEE_RATE)
  ) {
    throw new ValidationError(
      `LoanSet: OverpaymentFee must be between 0 and ${MAX_OVER_PAYMENT_FEE_RATE} inclusive`,
    )
  }

  if (
    tx.InterestRate != null &&
    (tx.InterestRate < 0 || tx.InterestRate > MAX_INTEREST_RATE)
  ) {
    throw new ValidationError(
      `LoanSet: InterestRate must be between 0 and ${MAX_INTEREST_RATE} inclusive`,
    )
  }

  if (
    tx.LateInterestRate != null &&
    (tx.LateInterestRate < 0 || tx.LateInterestRate > MAX_LATE_INTEREST_RATE)
  ) {
    throw new ValidationError(
      `LoanSet: LateInterestRate must be between 0 and ${MAX_LATE_INTEREST_RATE} inclusive`,
    )
  }

  if (
    tx.CloseInterestRate != null &&
    (tx.CloseInterestRate < 0 || tx.CloseInterestRate > MAX_CLOSE_INTEREST_RATE)
  ) {
    throw new ValidationError(
      `LoanSet: CloseInterestRate must be between 0 and ${MAX_CLOSE_INTEREST_RATE} inclusive`,
    )
  }

  if (
    tx.OverpaymentInterestRate != null &&
    (tx.OverpaymentInterestRate < 0 ||
      tx.OverpaymentInterestRate > MAX_OVER_PAYMENT_INTEREST_RATE)
  ) {
    throw new ValidationError(
      `LoanSet: OverpaymentInterestRate must be between 0 and ${MAX_OVER_PAYMENT_INTEREST_RATE} inclusive`,
    )
  }

  if (tx.PaymentInterval != null && tx.PaymentInterval < MIN_PAYMENT_INTERVAL) {
    throw new ValidationError(
      `LoanSet: PaymentInterval must be greater than or equal to ${MIN_PAYMENT_INTERVAL}`,
    )
  }

  if (
    tx.PaymentInterval != null &&
    tx.GracePeriod != null &&
    tx.GracePeriod > tx.PaymentInterval
  ) {
    throw new ValidationError(
      `LoanSet: GracePeriod must not be greater than PaymentInterval`,
    )
  }
}
