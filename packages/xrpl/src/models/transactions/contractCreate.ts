import { Function, InstanceParameter, InstanceParameterValue } from '../common'

import {
  BaseTransaction,
  GlobalFlagsInterface,
  isArray,
  isString,
  validateBaseTransaction,
  validateOptionalField,
} from './common'

/**
 * Enum representing values of {@link Contract} transaction flags.
 *
 * @category Transaction Flags
 */
export enum ContractFlags {
  tfImmutable = 0x00010000,
  tfCodeImmutable = 0x00020000,
  tfABIImmutable = 0x00040000,
  tfUndeletable = 0x00080000,
}

/**
 * Map of flags to boolean values representing {@link Contract} transaction
 * flags.
 *
 * @category Transaction Flags
 */
export interface ContractFlagsInterface extends GlobalFlagsInterface {
  tfImmutable?: boolean
  tfCodeImmutable?: boolean
  tfABIImmutable?: boolean
  tfUndeletable?: boolean
}

/**
 * @category Transaction Models
 */
export interface ContractCreate extends BaseTransaction {
  TransactionType: 'ContractCreate'

  ContractCode?: string

  ContractHash?: string

  Functions?: Function[]

  InstanceParameters?: InstanceParameter[]

  InstanceParameterValues?: InstanceParameterValue[]

  URI?: string
}

/**
 * Verify the form and type of a ContractCreate at runtime.
 *
 * @param tx - A ContractCreate Transaction.
 * @throws When the ContractCreate is malformed.
 */
export function validateContractCreate(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)

  validateOptionalField(tx, 'ContractCode', isString)

  validateOptionalField(tx, 'ContractHash', isString)

  validateOptionalField(tx, 'Functions', isArray)

  validateOptionalField(tx, 'InstanceParameters', isArray)

  validateOptionalField(tx, 'InstanceParameterValues', isArray)

  validateOptionalField(tx, 'URI', isString)
}
