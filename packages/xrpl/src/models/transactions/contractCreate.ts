import { ValidationError } from '../../errors'
import { isFlagEnabled } from '../utils'

import {
  BaseTransaction,
  GlobalFlags,
  GlobalFlagsInterface,
  isNumber,
  isRecord,
  validateBaseTransaction,
  validateFlagsMask,
} from './common'
import {
  ContractFunction,
  ContractInstanceParameter,
  ContractInstanceParameterValue,
} from './contractCommon'
import {
  validateContractCodeFieldTypes,
  validateContractCodeRules,
} from './contractRules'

/**
 * Enum representing values of {@link ContractCreate} transaction flags.
 * rippled stores them in the Contract ledger entry's Flags.
 *
 * @category Transaction Flags
 */
export enum ContractCreateFlags {
  /** Nothing about the contract can be changed by ContractModify. */
  tfImmutable = 0x00010000,
  /** The contract's code cannot be changed by ContractModify. */
  tfCodeImmutable = 0x00020000,
  /** The contract's Functions cannot be changed by ContractModify. */
  tfABIImmutable = 0x00040000,
  /** The contract cannot be deleted by ContractDelete. */
  tfUndeletable = 0x00080000,
}

/**
 * Map of flags to boolean values representing {@link ContractCreate}
 * transaction flags.
 *
 * @category Transaction Flags
 */
export interface ContractCreateFlagsInterface extends GlobalFlagsInterface {
  tfImmutable?: boolean
  tfCodeImmutable?: boolean
  tfABIImmutable?: boolean
  tfUndeletable?: boolean
}

/**
 * The ContractCreate transaction creates a smart contract and its
 * pseudo-account, from new ContractCode or from the ContractHash of an
 * existing ContractSource.
 *
 * @category Transaction Models
 */
export interface ContractCreate extends BaseTransaction {
  TransactionType: 'ContractCreate'

  /**
   * The contract's WebAssembly code, in hex, up to 200000 bytes. Exactly one of
   * ContractCode and ContractHash is required.
   */
  ContractCode?: string

  /**
   * The hash of an existing ContractSource ledger entry whose code the
   * contract runs. Exactly one of ContractCode and ContractHash is required.
   */
  ContractHash?: string

  /**
   * The contract's exported functions. Required, with 1 to 32 entries of
   * unique FunctionName, when ContractCode is set.
   */
  Functions?: ContractFunction[]

  /**
   * The parameters of the contract instance, 1 to 8 entries.
   */
  InstanceParameters?: ContractInstanceParameter[]

  /**
   * The values of the contract instance parameters, 1 to 8 entries, one per
   * InstanceParameters entry when both are set.
   */
  InstanceParameterValues?: ContractInstanceParameterValue[]

  /**
   * A URI for the contract, in hex.
   */
  URI?: string

  Flags?: number | ContractCreateFlagsInterface
}

const IMMUTABILITY_FLAGS = [
  ContractCreateFlags.tfImmutable,
  ContractCreateFlags.tfCodeImmutable,
  ContractCreateFlags.tfABIImmutable,
]

const FLAG_VALUES: Record<string, number> = {
  tfImmutable: ContractCreateFlags.tfImmutable,
  tfCodeImmutable: ContractCreateFlags.tfCodeImmutable,
  tfABIImmutable: ContractCreateFlags.tfABIImmutable,
  tfUndeletable: ContractCreateFlags.tfUndeletable,
  tfInnerBatchTxn: GlobalFlags.tfInnerBatchTxn,
}

/**
 * Read a ContractCreate's Flags as a number.
 *
 * @param flags - The transaction's Flags, numeric or a map of flag names.
 * @returns The numeric flags, or undefined when a name is unknown.
 */
function flagsToNumber(flags: unknown): number | undefined {
  if (flags == null) {
    return 0
  }
  if (!isRecord(flags)) {
    return isNumber(flags) ? flags : undefined
  }
  let total = 0
  for (const [name, enabled] of Object.entries(flags)) {
    if (!(name in FLAG_VALUES)) {
      return undefined
    }
    total += enabled === true ? FLAG_VALUES[name] : 0
  }
  return total
}

/**
 * Throw when Flags break rippled's ContractCreate flag mask
 * (`tfContractMask`) or set more than one immutability flag.
 *
 * @param tx - The ContractCreate transaction.
 * @throws When the flags are invalid.
 */
function validateContractCreateFlags(tx: Record<string, unknown>): void {
  validateFlagsMask(tx, ContractCreateFlags)
  const value = flagsToNumber(tx.Flags) ?? 0
  if (
    IMMUTABILITY_FLAGS.filter((flag) => isFlagEnabled(value, flag)).length > 1
  ) {
    throw new ValidationError(
      'ContractCreate: cannot set more than one of tfImmutable, tfCodeImmutable and tfABIImmutable',
    )
  }
}

/**
 * Verify the form and type of a {@link ContractCreate} at runtime.
 *
 * @param tx - A {@link ContractCreate} Transaction.
 * @throws When the {@link ContractCreate} is malformed.
 */
export function validateContractCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateContractCodeFieldTypes(tx)
  validateContractCreateFlags(tx)

  if (tx.ContractCode === undefined && tx.ContractHash === undefined) {
    throw new ValidationError(
      'ContractCreate: must set either ContractCode or ContractHash',
    )
  }

  validateContractCodeRules(tx)
}
