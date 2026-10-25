import { Account } from '../transactions/common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The ContractData object holds the data a smart contract stores for one
 * account.
 *
 * @category Ledger Entries
 */
export default interface ContractData
  extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'ContractData'

  /**
   * A bit-map of boolean flags.
   */
  Flags: number

  /**
   * Identifies the page where this item is referenced in the owner's directory.
   */
  OwnerNode: string

  /**
   * The account the data belongs to.
   */
  Owner: Account

  /**
   * The pseudo-account of the contract that stored the data.
   */
  ContractAccount: Account

  /**
   * The stored data: an object whose keys are hex encoded, or an array.
   */
  ContractJson: Record<string, unknown> | unknown[]
}
