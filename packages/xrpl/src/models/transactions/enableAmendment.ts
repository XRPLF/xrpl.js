import { BaseTransaction } from './common'

/**
 * Transaction Flags for an EnableAmendment Transaction.
 *
 * @category Transaction Flags
 */
export enum EnableAmendmentFlags {
  /** Support for this amendment increased to at least 80% of trusted validators starting with this ledger version. */
  tfGotMajority = 0x00010000,
  /** Support for this amendment decreased to less than 80% of trusted validators starting with this ledger version. */
  tfLostMajority = 0x00020000,
}

/**
 * Mark a change in the status of a proposed amendment when it gains majority, looses majority, or is enabled.
 *
 * @category Pseudo Transaction Models
 */
export interface EnableAmendment extends BaseTransaction {
  TransactionType: 'EnableAmendment'
  /** A unique identifier for the amendment. */
  Amendment: string
  /** The ledger index where this pseudo-transaction appears. */
  LedgerSequence: number
}
