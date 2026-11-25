import { InstanceParameterValue } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 *
 *
 * @category Ledger Entries
 */
export default interface Contract extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'Contract'
  /** The sequence number of the next valid transaction for this account. */
  Sequence: number
  /** The owner node for this contract. */
  OwnerNode: string
  /** The account that owns this contract. */
  Owner: string
  /** The account associated with this contract. */
  ContractAccount: string
  /** The hash of the contract. */
  ContractHash: string
  /** Instance parameter values for the contract. */
  InstanceParameterValues?: InstanceParameterValue[]
  /** URI associated with the contract. */
  URI?: string
}
