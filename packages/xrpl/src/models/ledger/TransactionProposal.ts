import type { SubmittableTransaction } from '../transactions/transaction'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * A TransactionProposal holds an unsigned transaction on the ledger while its
 * signers add signatures.
 *
 * @category Ledger Entries
 */
export default interface TransactionProposal
  extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'TransactionProposal'
  /** A bit-map of boolean flags. No flags are defined. */
  Flags: number
  /** The account that created the proposal and holds its reserve. */
  Owner: string
  /** The proposed transaction, carrying the signatures added so far. */
  ProposedTransaction: SubmittableTransaction
  /**
   * The time, in seconds since the Ripple Epoch, after which the proposal
   * accepts no more signatures.
   */
  Expiration: number
  /**
   * A hint indicating which page of the owner directory links to this object.
   */
  OwnerNode: string
}
