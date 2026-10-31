import { ValidationError } from '../../errors'

import {
  BaseTransaction,
  isLedgerEntryId,
  validateBaseTransaction,
  validateRequiredField,
} from './common'

// A ledger entry ID of all zeros
const ZERO_ID = /^0+$/u

/**
 * The TransactionProposalCancel transaction deletes a TransactionProposal and
 * releases its owner's reserve. While the proposal is live only its Owner or
 * the proposed transaction's account may cancel it; once it has expired
 * anyone may.
 *
 * @category Transaction Models
 */
export interface TransactionProposalCancel extends BaseTransaction {
  TransactionType: 'TransactionProposalCancel'
  /**
   * The ID of the TransactionProposal ledger entry to delete.
   */
  ProposalID: string
}

/**
 * Verify the form and type of a TransactionProposalCancel at runtime.
 *
 * @param tx - A TransactionProposalCancel Transaction.
 * @throws When the TransactionProposalCancel is malformed.
 */
export function validateTransactionProposalCancel(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'ProposalID', isLedgerEntryId)

  if (ZERO_ID.test(tx.ProposalID)) {
    throw new ValidationError(
      'TransactionProposalCancel: ProposalID must not be zero',
    )
  }
}
