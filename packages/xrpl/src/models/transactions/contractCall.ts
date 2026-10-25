import { ValidationError } from '../../errors'

import {
  Account,
  BaseTransaction,
  isAccount,
  isNumber,
  validateBaseTransaction,
  validateOptionalField,
  validateRequiredField,
} from './common'
import {
  ContractParameter,
  isContractParameters,
  isHexBlob,
  MAX_CONTRACT_GAS,
} from './contractCommon'
import { validateFlagParameters, validateParameterFlags } from './contractRules'

/**
 * The ContractCall transaction calls a function of a smart contract.
 *
 * @category Transaction Models
 */
export interface ContractCall extends BaseTransaction {
  TransactionType: 'ContractCall'

  /**
   * The pseudo-account of the contract to call.
   */
  ContractAccount: Account

  /**
   * The name of the function to call, hex encoded.
   */
  FunctionName: string

  /**
   * The arguments of the call. A tfSendAmount parameter sends its AMOUNT value
   * to the contract; a tfSendNFToken parameter sends the NFToken its UINT256
   * value names.
   */
  Parameters?: ContractParameter[]

  /**
   * The gas the call may use, from 1 to 2000000.
   */
  Gas: number
}

/**
 * Verify the form and type of a {@link ContractCall} at runtime.
 *
 * @param tx - A {@link ContractCall} Transaction.
 * @throws When the {@link ContractCall} is malformed.
 */
export function validateContractCall(tx: Record<string, unknown>): void {
  validateBaseTransaction(tx)
  validateRequiredField(tx, 'ContractAccount', isAccount)
  validateRequiredField(tx, 'FunctionName', isHexBlob)
  validateRequiredField(tx, 'Gas', isNumber)
  validateOptionalField(tx, 'Parameters', isContractParameters)

  if (!Number.isInteger(tx.Gas) || tx.Gas < 1 || tx.Gas > MAX_CONTRACT_GAS) {
    throw new ValidationError(
      `ContractCall: Gas must be an integer from 1 to ${MAX_CONTRACT_GAS}`,
    )
  }

  if (tx.Parameters !== undefined) {
    const params = tx.Parameters.map((param) => param.Parameter)
    validateParameterFlags('ContractCall', 'Parameters', params)
    validateFlagParameters('ContractCall', params)
  }
}
