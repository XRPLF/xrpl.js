/**
 * Mark a change to the Negative UNL.
 *
 * @category Pseudo Transaction Models
 */
export interface UNLModify {
  TransactionType: 'UNLModify'
  /**
   * The ledger index where this pseudo-transaction appears.
   * This distinguishes the pseudo-transaction from other occurrences of the same change.
   */
  LedgerSequence: number
  /**
   * If 0, this change represents removing a validator from the Negative UNL.
   * If 1, this change represents adding a validator to the Negative UNL.
   */
  UNLModifyDisabling: 0 | 1
  /** The validator to add or remove, as identified by its master public key. */
  UNLModifyValidator: string
}
