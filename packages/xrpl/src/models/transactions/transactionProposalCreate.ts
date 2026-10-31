import { ValidationError } from '../../errors'
import { hasFlag } from '../utils'

import {
  BaseTransaction,
  GlobalFlags,
  isArray,
  isNumber,
  isRecord,
  isString,
  validateBaseTransaction,
  validateRequiredField,
} from './common'
import type { SubmittableTransaction } from './transaction'

// Types a proposed transaction may not be, nor carry as a Batch inner transaction
const PROPOSAL_TYPES = [
  'TransactionProposalCreate',
  'TransactionProposalCancel',
]
const PSEUDO_TYPES = ['EnableAmendment', 'SetFee', 'UNLModify']

// Fields that mean the proposed transaction is already signed
const SIGNATURE_FIELDS = [
  'TxnSignature',
  'Signers',
  'BatchSigners',
  'CounterpartySignature',
  'SponsorSignature',
]

/**
 * The TransactionProposalCreate transaction posts an unsigned transaction on
 * the ledger as a TransactionProposal, where its signers add signatures.
 *
 * @category Transaction Models
 */
export interface TransactionProposalCreate extends BaseTransaction {
  TransactionType: 'TransactionProposalCreate'
  /**
   * The proposed transaction in unsigned canonical form: an empty
   * SigningPubKey, no signature fields, a TicketSequence and Sequence 0.
   */
  ProposedTransaction: SubmittableTransaction
  /**
   * The time, in seconds since the Ripple Epoch, after which the proposal
   * accepts no more signatures. Must not be 0.
   */
  Expiration: number
}

function isProposableType(type: unknown, nested: boolean): boolean {
  return (
    isString(type) &&
    !PROPOSAL_TYPES.includes(type) &&
    !PSEUDO_TYPES.includes(type) &&
    !(nested && type === 'Batch')
  )
}

/**
 * Whether the proposed transaction could be submitted on its own: not a
 * proposal, a pseudo-transaction or a Batch inner transaction, and, for a
 * Batch, none of its inner transactions a proposal, a Batch or a
 * pseudo-transaction.
 *
 * @param proposed - The ProposedTransaction field.
 * @returns Whether the proposed transaction is independently submittable.
 */
function isIndependentlySubmittable(
  proposed: Record<string, unknown>,
): boolean {
  if (!isProposableType(proposed.TransactionType, false)) {
    return false
  }
  if (hasFlag(proposed, GlobalFlags.tfInnerBatchTxn, 'tfInnerBatchTxn')) {
    return false
  }
  if (
    proposed.TransactionType !== 'Batch' ||
    !isArray(proposed.RawTransactions)
  ) {
    return true
  }
  return proposed.RawTransactions.every(
    (inner) =>
      isRecord(inner) &&
      isRecord(inner.RawTransaction) &&
      isProposableType(inner.RawTransaction.TransactionType, true),
  )
}

/**
 * Verify that the proposed transaction is in unsigned canonical form and does
 * not use the Ticket the proposing transaction consumes.
 *
 * @param tx - A TransactionProposalCreate Transaction.
 * @param proposed - Its ProposedTransaction field.
 * @throws When the ProposedTransaction is not proposable.
 */
function validateProposedTransaction(
  tx: Record<string, unknown>,
  proposed: Record<string, unknown>,
): void {
  if (!isIndependentlySubmittable(proposed)) {
    throw new ValidationError(
      'TransactionProposalCreate: ProposedTransaction must be independently submittable',
    )
  }

  if (SIGNATURE_FIELDS.some((field) => proposed[field] !== undefined)) {
    throw new ValidationError(
      'TransactionProposalCreate: ProposedTransaction must not carry signature fields',
    )
  }

  if (proposed.SigningPubKey !== '') {
    throw new ValidationError(
      'TransactionProposalCreate: ProposedTransaction SigningPubKey must be present and empty',
    )
  }

  if (proposed.TicketSequence === undefined || proposed.Sequence !== 0) {
    throw new ValidationError(
      'TransactionProposalCreate: ProposedTransaction must use a TicketSequence with Sequence 0',
    )
  }

  if (
    tx.TicketSequence !== undefined &&
    proposed.Account === tx.Account &&
    proposed.TicketSequence === tx.TicketSequence
  ) {
    throw new ValidationError(
      'TransactionProposalCreate: ProposedTransaction uses the Ticket this transaction consumes',
    )
  }
}

/**
 * Verify the form and type of a TransactionProposalCreate at runtime. The
 * ProposedTransaction's own fields are validated in `validate`.
 *
 * @param tx - A TransactionProposalCreate Transaction.
 * @throws When the TransactionProposalCreate is malformed.
 */
export function validateTransactionProposalCreate(
  tx: Record<string, unknown>,
): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'ProposedTransaction', isRecord)
  validateRequiredField(tx, 'Expiration', isNumber)

  if (tx.Expiration === 0) {
    throw new ValidationError(
      'TransactionProposalCreate: Expiration must not be 0',
    )
  }

  validateProposedTransaction(tx, tx.ProposedTransaction)
}
