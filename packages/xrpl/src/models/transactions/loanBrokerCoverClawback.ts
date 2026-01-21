import BigNumber from 'bignumber.js'

import { ValidationError } from '../../errors'
import { IssuedCurrencyAmount, MPTAmount } from '../common'

import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  isString,
  validateOptionalField,
  isTokenAmount,
} from './common'

/**
 * The LoanBrokerCoverClawback transaction claws back the First-Loss Capital from the Loan Broker.
 * The transaction can only be submitted by the Issuer of the Loan asset.
 * Furthermore, the transaction can only clawback funds up to the minimum cover required for the current loans.
 *
 * @category Transaction Models
 */
export interface LoanBrokerCoverClawback extends BaseTransaction {
  TransactionType: 'LoanBrokerCoverClawback'

  /**
   * The Loan Broker ID from which to withdraw First-Loss Capital.
   * Must be provided if the Amount is an MPT, or Amount is an IOU
   * and issuer is specified as the Account submitting the transaction.
   */
  LoanBrokerID?: string

  /**
   * The First-Loss Capital amount to clawback.
   * If the amount is 0 or not provided, clawback funds up to LoanBroker.DebtTotal * LoanBroker.CoverRateMinimum.
   */
  Amount?: IssuedCurrencyAmount | MPTAmount
}

/**
 * Verify the form and type of an LoanBrokerCoverClawback at runtime.
 *
 * @param tx - LoanBrokerCoverClawback Transaction.
 * @throws When LoanBrokerCoverClawback is Malformed.
 */
export function validateLoanBrokerCoverClawback(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'LoanBrokerID', isString)
  validateOptionalField(tx, 'Amount', isTokenAmount)

  if (tx.LoanBrokerID != null && !isLedgerEntryId(tx.LoanBrokerID)) {
    throw new ValidationError(
      `LoanBrokerCoverClawback: LoanBrokerID must be 64 characters hexadecimal string`,
    )
  }

  if (tx.Amount != null && new BigNumber(tx.Amount.value).isLessThan(0)) {
    throw new ValidationError(`LoanBrokerCoverClawback: Amount must be >= 0`)
  }

  if (tx.LoanBrokerID == null && tx.Amount == null) {
    throw new ValidationError(
      `LoanBrokerCoverClawback: Either LoanBrokerID or Amount is required`,
    )
  }
}
