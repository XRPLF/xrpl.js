import { ValidationError } from '../../errors'

import {
  Account,
  areAddressesEqual,
  BaseTransaction,
  isAccount,
  validateBaseTransaction,
  validateOptionalField,
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
 * The ContractModify transaction changes a smart contract's code, functions,
 * instance parameters, URI or owner.
 *
 * @category Transaction Models
 */
export interface ContractModify extends BaseTransaction {
  TransactionType: 'ContractModify'

  /**
   * The contract's pseudo-account. When omitted, the contract is the one
   * whose pseudo-account is Account.
   */
  ContractAccount?: Account

  /**
   * The new owner of the contract. Must differ from Account and from
   * ContractAccount.
   */
  Owner?: Account

  /**
   * New WebAssembly code for the contract, in hex, up to 200000 bytes. Not
   * allowed together with ContractHash.
   */
  ContractCode?: string

  /**
   * The hash of an existing ContractSource ledger entry whose code the
   * contract runs. Not allowed together with ContractCode.
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
}

/**
 * Verify the form and type of a {@link ContractModify} at runtime.
 *
 * @param tx - A {@link ContractModify} Transaction.
 * @throws When the {@link ContractModify} is malformed.
 */
export function validateContractModify(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateOptionalField(tx, 'ContractAccount', isAccount)
  validateOptionalField(tx, 'Owner', isAccount)
  validateContractCodeFieldTypes(tx)

  validateContractCodeRules(tx)

  if (tx.Owner !== undefined) {
    if (areAddressesEqual(tx.Owner, tx.Account)) {
      throw new ValidationError('ContractModify: Owner must not be the Account')
    }
    if (
      tx.ContractAccount !== undefined &&
      areAddressesEqual(tx.Owner, tx.ContractAccount)
    ) {
      throw new ValidationError(
        'ContractModify: Owner must not be the ContractAccount',
      )
    }
  }
}
