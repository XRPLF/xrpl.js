import { Account, XRPLNumber } from '../transactions/common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The LoanBroker object captures attributes of the Lending Protocol.
 *
 * @category Ledger Entries
 */
export default interface LoanBroker extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'LoanBroker'

  /**
   * Ledger object flags.
   */
  Flags: number

  /**
   * The transaction sequence number of LoanBrokerSet transaction that created this LoanBroker object.
   */
  Sequence: number

  /**
   * A sequential identifier for Loan objects, incremented each time a new Loan is created by this LoanBroker instance.
   */
  LoanSequence: number

  /**
   * Identifies the page where this item is referenced in the owner's directory.
   */
  OwnerNode: string

  /**
   * Identifies the page where this item is referenced in the Vault's pseudo-account owner's directory.
   */
  VaultNode: string

  /**
   * The ID of the Vault object associated with this Lending Protocol Instance.
   */
  VaultID: string

  /**
   * The address of the LoanBroker pseudo-account.
   */
  Account: Account

  /**
   * The address of the Loan Broker account.
   */
  Owner: Account

  /**
   * The number of active Loans issued by the LoanBroker.
   */
  OwnerCount?: number

  /**
   * The total asset amount the protocol owes the Vault, including interest.
   */
  DebtTotal?: XRPLNumber

  /**
   *  The maximum amount the protocol can owe the Vault. The default value of 0 means there is no limit to the debt.
   */
  DebtMaximum: XRPLNumber

  /**
   * The total amount of first-loss capital deposited into the Lending Protocol.
   */
  CoverAvailable?: XRPLNumber

  /**
   * The 1/10th basis point of the DebtTotal that the first loss capital must cover.
   * Valid values are between 0 and 100000 inclusive. A value of 1 is equivalent to 1/10 bps or 0.001%.
   */
  CoverRateMinimum?: number

  /**
   * The 1/10th basis point of minimum required first loss capital that is liquidated to cover a Loan default.
   * Valid values are between 0 and 100000 inclusive. A value of 1 is equivalent to 1/10 bps or 0.001%.
   */
  CoverRateLiquidation?: number
}
