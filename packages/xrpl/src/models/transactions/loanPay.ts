import { ValidationError } from '../../errors'
import { Amount, MPTAmount } from '../common'
import { isFlagEnabled } from '../utils'

import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  isString,
  validateRequiredField,
  isAmount,
  GlobalFlagsInterface,
} from './common'

/**
 * Enum representing values of {@link LoanPay} transaction flags.
 *
 * @category Transaction Flags
 */
export enum LoanPayFlags {
  /**
   * Indicates that remaining payment amount should be treated as an overpayment.
   */
  tfLoanOverpayment = 0x00010000,
  /**
   * Indicates that the borrower is making a full early repayment.
   */
  tfLoanFullPayment = 0x00020000,
  /**
   * Indicates that the borrower is making a late loan payment.
   */
  tfLoanLatePayment = 0x00040000,
}

/**
 * Map of flags to boolean values representing {@link LoanPay} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface LoanPayFlagsInterface extends GlobalFlagsInterface {
  tfLoanOverpayment?: boolean
  tfLoanFullPayment?: boolean
  tfLoanLatePayment?: boolean
}

/**
 * The Borrower submits a LoanPay transaction to make a Payment on the Loan.
 *
 * @category Transaction Models
 */
export interface LoanPay extends BaseTransaction {
  TransactionType: 'LoanPay'

  /**
   * The ID of the Loan object to be paid to.
   */
  LoanID: string

  /**
   * The amount of funds to pay.
   */
  Amount: Amount | MPTAmount

  Flags?: number | LoanPayFlagsInterface
}

/**
 * Verify the form and type of an LoanPay at runtime.
 *
 * @param tx - LoanPay Transaction.
 * @throws When LoanPay is Malformed.
 */
export function validateLoanPay(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'LoanID', isString)
  validateRequiredField(tx, 'Amount', isAmount)

  if (!isLedgerEntryId(tx.LoanID)) {
    throw new ValidationError(
      `LoanPay: LoanID must be 64 characters hexadecimal string`,
    )
  }

  // Validate that at most one of the payment type flags is set
  if (typeof tx.Flags === 'number') {
    const flagsSet = [
      isFlagEnabled(tx.Flags, LoanPayFlags.tfLoanLatePayment),
      isFlagEnabled(tx.Flags, LoanPayFlags.tfLoanFullPayment),
      isFlagEnabled(tx.Flags, LoanPayFlags.tfLoanOverpayment),
    ].filter(Boolean).length

    if (flagsSet > 1) {
      throw new ValidationError(
        'LoanPay: Only one of tfLoanLatePayment, tfLoanFullPayment, or tfLoanOverpayment flags can be set',
      )
    }
  } else if (tx.Flags != null && typeof tx.Flags === 'object') {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- required to check flag values
    const flags = tx.Flags as unknown as Record<string, unknown>
    const flagsSet = [
      flags.tfLoanLatePayment,
      flags.tfLoanFullPayment,
      flags.tfLoanOverpayment,
    ].filter(Boolean).length

    if (flagsSet > 1) {
      throw new ValidationError(
        'LoanPay: Only one of tfLoanLatePayment, tfLoanFullPayment, or tfLoanOverpayment flags can be set',
      )
    }
  }
}
