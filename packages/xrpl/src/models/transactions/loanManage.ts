import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  isString,
  validateRequiredField,
  GlobalFlagsInterface,
} from './common'

/**
 * The transaction modifies an existing Loan object.
 *
 * @category Transaction Models
 */
export interface LoanManage extends BaseTransaction {
  TransactionType: 'LoanManage'

  /**
   * The ID of the Loan object to be updated.
   */
  LoanID: string

  Flags?: number | LoanManageFlagsInterface
}

/**
 * Transaction Flags for an LoanManage Transaction.
 *
 * @category Transaction Flags
 */
export enum LoanManageFlags {
  /**
   * Indicates that the Loan should be defaulted.
   */
  tfLoanDefault = 0x00010000,

  /**
   * Indicates that the Loan should be impaired.
   */
  tfLoanImpair = 0x00020000,

  /**
   * Indicates that the Loan should be un-impaired.
   */
  tfLoanUnimpair = 0x00040000,
}

/**
 * Map of flags to boolean values representing {@link LoanManage} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface LoanManageFlagsInterface extends GlobalFlagsInterface {
  tfLoanDefault?: boolean
  tfLoanImpair?: boolean
  tfLoanUnimpair?: boolean
}

/**
 * Verify the form and type of an LoanManage at runtime.
 *
 * @param tx - LoanManage Transaction.
 * @throws When LoanManage is Malformed.
 */
export function validateLoanManage(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateRequiredField(tx, 'LoanID', isString)

  if (!isLedgerEntryId(tx.LoanID)) {
    throw new ValidationError(
      `LoanManage: LoanID must be 64 characters hexadecimal string`,
    )
  }
}
