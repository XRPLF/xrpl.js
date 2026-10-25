import BigNumber from 'bignumber.js'

import { ValidationError } from '../../errors'

import {
  isAmount,
  isMPTAmount,
  isString,
  MAX_MPT_AMOUNT,
  validateOptionalField,
} from './common'
import {
  ContractCodeFields,
  ContractInstanceParameter,
  ContractInstanceParameterValue,
  ContractParameter,
  ContractParameterFlags,
  HEX_CHARS_PER_BYTE,
  isContractFunctions,
  isContractInstanceParameters,
  isContractInstanceParameterValues,
  isHash256,
  isHexBlob,
  isValidParameterFlag,
  MAX_CONTRACT_CODE_BYTES,
  MAX_CONTRACT_FUNCTIONS,
  MAX_CONTRACT_PARAMS,
  ParameterFields,
  ParameterValue,
} from './contractCommon'

/** The 160-bit currency rippled calls `badCurrency()`: the code "XRP" as a token. */
const BAD_CURRENCY_HEX = '0000000000000000000000005852500000000000'

/**
 * Throw when an array holds no entries or more than {@link MAX_CONTRACT_PARAMS}.
 *
 * @param txType - The transaction type, for the error message.
 * @param field - The array's field name.
 * @param length - The array's length.
 * @throws When the length is out of range.
 */
function validateParamsLength(
  txType: string,
  field: string,
  length: number,
): void {
  if (length === 0) {
    throw new ValidationError(`${txType}: ${field} must not be empty`)
  }
  if (length > MAX_CONTRACT_PARAMS) {
    throw new ValidationError(
      `${txType}: ${field} must not have more than ${MAX_CONTRACT_PARAMS} entries`,
    )
  }
}

/**
 * Throw when a ParameterFlag of `params` holds a non-parameter flag.
 *
 * @param txType - The transaction type, for the error message.
 * @param field - The array's field name, for the error message.
 * @param params - The inner objects of the array.
 * @throws When a ParameterFlag is invalid.
 */
export function validateParameterFlags(
  txType: string,
  field: string,
  params: Array<{ ParameterFlag?: number }>,
): void {
  for (const param of params) {
    if (
      param.ParameterFlag !== undefined &&
      !isValidParameterFlag(param.ParameterFlag)
    ) {
      throw new ValidationError(`${txType}: invalid ParameterFlag in ${field}`)
    }
  }
}

function isPositive(value: string): boolean {
  return new BigNumber(value).isGreaterThan(0)
}

/**
 * Throw when a tfSendAmount parameter's value is not a positive amount of a
 * valid asset (rippled `preflightFlagParameters`).
 *
 * @param txType - The transaction type, for the error message.
 * @param data - The parameter's ParameterValue.
 * @throws When the value cannot be sent.
 */
function validateSendAmount(
  txType: string,
  data: ParameterValue | undefined,
): void {
  const prefix = `${txType}: a tfSendAmount parameter must`
  if (data?.type !== 'AMOUNT' || !isAmount(data.value)) {
    throw new ValidationError(`${prefix} hold an AMOUNT ParameterValue`)
  }
  const amount = data.value
  const value = isString(amount) ? amount : amount.value
  if (!isPositive(value)) {
    throw new ValidationError(`${prefix} send a positive amount`)
  }
  if (
    isMPTAmount(amount) &&
    new BigNumber(value).isGreaterThan(MAX_MPT_AMOUNT.toString())
  ) {
    throw new ValidationError(
      `${prefix} not send more than ${MAX_MPT_AMOUNT.toString()} of an MPT`,
    )
  }
  if (
    !isString(amount) &&
    !isMPTAmount(amount) &&
    amount.currency.toUpperCase() === BAD_CURRENCY_HEX
  ) {
    throw new ValidationError(
      `${prefix} not send a token with the XRP currency code`,
    )
  }
}

/**
 * Throw when one parameter's ParameterFlag and ParameterValue disagree.
 *
 * @param txType - The transaction type, for the error message.
 * @param param - The fields of the parameter.
 * @throws When the flagged parameter is malformed.
 */
function validateFlagParameter(txType: string, param: ParameterFields): void {
  const flag = param.ParameterFlag
  if (flag === ContractParameterFlags.tfSendAmount) {
    validateSendAmount(txType, param.ParameterValue)
  } else if (
    flag === ContractParameterFlags.tfSendNFToken &&
    param.ParameterValue?.type !== 'UINT256'
  ) {
    throw new ValidationError(
      `${txType}: a tfSendNFToken parameter must hold a UINT256 ParameterValue`,
    )
  } else if (flag === ContractParameterFlags.tfAuthorizeToken) {
    throw new ValidationError(
      `${txType}: tfAuthorizeToken parameters are disabled`,
    )
  }
}

/**
 * Throw when a parameter's ParameterFlag and ParameterValue disagree (rippled
 * `preflightFlagParameters`). Only the exact flags tfSendAmount, tfSendNFToken
 * and tfAuthorizeToken carry a rule.
 *
 * @param txType - The transaction type, for the error message.
 * @param params - The inner objects of a Parameters or InstanceParameterValues
 * array.
 * @throws When a flagged parameter is malformed.
 */
export function validateFlagParameters(
  txType: string,
  params: ParameterFields[],
): void {
  for (const param of params) {
    validateFlagParameter(txType, param)
  }
}

/**
 * Throw when a Function's Parameters break rippled's `preflightFunctions`.
 *
 * @param txType - The transaction type, for the error message.
 * @param params - The Function's Parameters.
 * @throws When there are too many Parameters or one lacks a flag or type.
 */
function validateFunctionParameters(
  txType: string,
  params: ContractParameter[],
): void {
  if (params.length > MAX_CONTRACT_PARAMS) {
    throw new ValidationError(
      `${txType}: a Function must not have more than ${MAX_CONTRACT_PARAMS} Parameters`,
    )
  }
  for (const { Parameter: param } of params) {
    if (param.ParameterFlag === undefined) {
      throw new ValidationError(
        `${txType}: each Function Parameter requires ParameterFlag`,
      )
    }
    if (param.ParameterType === undefined) {
      throw new ValidationError(
        `${txType}: each Function Parameter requires ParameterType`,
      )
    }
    validateParameterFlags(txType, 'Functions', [param])
  }
}

/**
 * Throw when Functions break rippled's `preflightFunctions`, which applies
 * only when ContractCode is present.
 *
 * @param txType - The transaction type, for the error message.
 * @param tx - The transaction.
 * @throws When Functions is missing, empty, too large or malformed.
 */
function validateFunctions(txType: string, tx: ContractCodeFields): void {
  if (tx.ContractCode === undefined) {
    return
  }
  const functions = tx.Functions
  if (functions === undefined) {
    throw new ValidationError(
      `${txType}: Functions is required when ContractCode is set`,
    )
  }
  if (functions.length === 0) {
    throw new ValidationError(`${txType}: Functions must not be empty`)
  }
  if (functions.length > MAX_CONTRACT_FUNCTIONS) {
    throw new ValidationError(
      `${txType}: Functions must not have more than ${MAX_CONTRACT_FUNCTIONS} entries`,
    )
  }
  const names = new Set<string>()
  for (const { Function: fn } of functions) {
    const name = fn.FunctionName.toUpperCase()
    if (names.has(name)) {
      throw new ValidationError(
        `${txType}: duplicate FunctionName in Functions`,
      )
    }
    names.add(name)
    validateFunctionParameters(txType, fn.Parameters ?? [])
  }
}

/**
 * Throw when InstanceParameters break rippled's
 * `preflightInstanceParameters`.
 *
 * @param txType - The transaction type, for the error message.
 * @param params - The InstanceParameters, if present.
 * @throws When the array is empty, too large or holds an invalid flag.
 */
function validateInstanceParameters(
  txType: string,
  params: ContractInstanceParameter[] | undefined,
): void {
  if (params === undefined) {
    return
  }
  validateParamsLength(txType, 'InstanceParameters', params.length)
  validateParameterFlags(
    txType,
    'InstanceParameters',
    params.map((param) => param.InstanceParameter),
  )
}

/**
 * Throw when InstanceParameterValues break rippled's
 * `preflightInstanceParameterValues`.
 *
 * @param txType - The transaction type, for the error message.
 * @param values - The InstanceParameterValues, if present.
 * @param params - The InstanceParameters, if present.
 * @throws When the array is empty, too large, holds an invalid flag, does not
 * match InstanceParameters, or holds a malformed flagged value.
 */
function validateInstanceParameterValues(
  txType: string,
  values: ContractInstanceParameterValue[] | undefined,
  params: ContractInstanceParameter[] | undefined,
): void {
  if (values === undefined) {
    return
  }
  validateParamsLength(txType, 'InstanceParameterValues', values.length)
  const inner = values.map((value) => value.InstanceParameterValue)
  validateParameterFlags(txType, 'InstanceParameterValues', inner)
  if (params !== undefined && params.length !== values.length) {
    throw new ValidationError(
      `${txType}: InstanceParameterValues must have one entry per InstanceParameters entry`,
    )
  }
  validateFlagParameters(txType, inner)
}

/**
 * Verify the types of the fields ContractCreate and ContractModify share.
 *
 * @param tx - A ContractCreate or ContractModify transaction.
 * @throws When a field has the wrong type.
 */
export function validateContractCodeFieldTypes(
  tx: Record<string, unknown>,
): asserts tx is Record<string, unknown> & ContractCodeFields {
  validateOptionalField(tx, 'ContractCode', isHexBlob)
  validateOptionalField(tx, 'ContractHash', isHash256)
  validateOptionalField(tx, 'Functions', isContractFunctions)
  validateOptionalField(tx, 'InstanceParameters', isContractInstanceParameters)
  validateOptionalField(
    tx,
    'InstanceParameterValues',
    isContractInstanceParameterValues,
  )
  validateOptionalField(tx, 'URI', isHexBlob)
}

/**
 * Verify the preflight rules ContractCreate and ContractModify share, in
 * rippled's order: ContractCode and ContractHash exclusive, the ContractCode
 * size, Functions, InstanceParameters and InstanceParameterValues.
 *
 * @param tx - A ContractCreate or ContractModify transaction whose field types
 * were checked by {@link validateContractCodeFieldTypes}.
 * @throws When a rule is broken.
 */
export function validateContractCodeRules(tx: ContractCodeFields): void {
  const txType = tx.TransactionType
  if (tx.ContractCode !== undefined && tx.ContractHash !== undefined) {
    throw new ValidationError(
      `${txType}: cannot set both ContractCode and ContractHash`,
    )
  }
  if (
    tx.ContractCode !== undefined &&
    tx.ContractCode.length / HEX_CHARS_PER_BYTE > MAX_CONTRACT_CODE_BYTES
  ) {
    throw new ValidationError(
      `${txType}: ContractCode exceeds ${MAX_CONTRACT_CODE_BYTES} bytes`,
    )
  }
  validateFunctions(txType, tx)
  validateInstanceParameters(txType, tx.InstanceParameters)
  validateInstanceParameterValues(
    txType,
    tx.InstanceParameterValues,
    tx.InstanceParameters,
  )
}
