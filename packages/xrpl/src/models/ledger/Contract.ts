import { Account } from '../transactions/common'
import { ContractInstanceParameterValue } from '../transactions/contractCommon'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The Contract object represents a smart contract instance and its
 * pseudo-account.
 *
 * @category Ledger Entries
 */
export default interface Contract extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Contract'

  /**
   * A bit-map of boolean flags: the {@link ContractCreateFlags} the contract
   * was created with.
   */
  Flags: number

  /**
   * The sequence number of the ContractCreate that created the contract.
   */
  Sequence: number

  /**
   * Identifies the page where this item is referenced in the owner's directory.
   */
  OwnerNode: string

  /**
   * The account that owns the contract.
   */
  Owner: Account

  /**
   * The contract's pseudo-account.
   */
  ContractAccount: Account

  /**
   * The hash of the ContractSource whose code the contract runs.
   */
  ContractHash: string

  /**
   * The values of the contract instance parameters.
   */
  InstanceParameterValues?: ContractInstanceParameterValue[]

  /**
   * A URI for the contract, in hex.
   */
  URI?: string
}
