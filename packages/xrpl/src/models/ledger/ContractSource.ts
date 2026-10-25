import {
  ContractFunction,
  ContractInstanceParameter,
} from '../transactions/contractCommon'

import { BaseLedgerEntry, HasPreviousTxnID } from './BaseLedgerEntry'

/**
 * The ContractSource object holds the WebAssembly code of smart contracts,
 * shared by every Contract whose ContractHash names it.
 *
 * @category Ledger Entries
 */
export default interface ContractSource
  extends BaseLedgerEntry, HasPreviousTxnID {
  LedgerEntryType: 'ContractSource'

  /**
   * A bit-map of boolean flags.
   */
  Flags: number

  /**
   * The hash of ContractCode.
   */
  ContractHash: string

  /**
   * The contract's WebAssembly code, in hex.
   */
  ContractCode: string

  /**
   * The contract's exported functions.
   */
  Functions: ContractFunction[]

  /**
   * The parameters of a contract instance.
   */
  InstanceParameters?: ContractInstanceParameter[]

  /**
   * The number of Contract objects that use this code.
   */
  ReferenceCount: string
}
