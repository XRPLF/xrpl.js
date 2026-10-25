import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The Beneficiary object names the account that may sign for its owner once
 * the owner has been silent for `TimeLock` seconds. It is created, updated and
 * deleted by the BeneficiarySet transaction.
 *
 * @category Ledger Entries
 */
export default interface Beneficiary extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Beneficiary'

  /**
   * The account that designated the beneficiary and owns this object.
   */
  Account: string

  /**
   * The account that may sign for `Account` after `TimeLock` seconds of
   * inactivity.
   */
  Beneficiary: string

  /**
   * The inactivity period, in seconds, after which the beneficiary may act.
   */
  TimeLock: number

  /**
   * A hint indicating which page of the owner's directory links to this
   * object, in case the directory consists of multiple pages.
   */
  OwnerNode: string

  /**
   * A bit-map of boolean flags. No flags are defined for the Beneficiary
   * object type, so this value is always 0.
   */
  Flags: 0
}
