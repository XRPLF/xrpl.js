import { Function, InstanceParameter } from '../common'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 *
 *
 * @category Ledger Entries
 */
export default interface ContractSource
  extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'ContractSource'
  /** The hash of the contract. */
  ContractHash: string
  /** The code for the contract. */
  ContractCode: string
  /** The functions available in this contract. */
  Functions: Function[]
  /** Instance parameters for the contract. */
  InstanceParameters?: InstanceParameter[]
  /** Reference count for this contract source. */
  ReferenceCount: number

  Flags: number
}

/**
 * A boolean map of ContractFlags for simplified code checking Contract settings.
 * For submitting settings flags to the ledger, use ContractFlags instead.
 */
export interface ContractFlagsInterface {
  /**
   * Indicates whether the contract is immutable.
   */
  lsfImmutable?: boolean
  /**
   * Indicates whether the contract code is immutable.
   */
  tfCodeImmutable?: boolean
  /**
   * Indicates whether the contract ABI is immutable.
   */
  tfABIImmutable?: boolean
  /**
   * Indicates whether the contract is undeletable.
   */
  tfUndeletable?: boolean
}

export enum ContractFlags {
  /**
   * Indicates whether the contract is immutable.
   */
  lsfImmutable = 0x00010000,
  /**
   * Indicates whether the contract code is immutable.
   */
  tfCodeImmutable = 0x00020000,
  /**
   * Indicates whether the contract ABI is immutable.
   */
  tfABIImmutable = 0x00040000,
  /**
   * Indicates whether the contract is undeletable.
   */
  tfUndeletable = 0x00080000,
}
