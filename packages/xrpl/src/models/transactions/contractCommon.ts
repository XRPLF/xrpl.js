import { Amount, Currency, MPTAmount } from '../common'
import { isFlagEnabled, isHex } from '../utils'

import { isArray, isNumber, isRecord, isString } from './common'

/** Maximum number of entries in Functions (rippled `maxContractFunctions`). */
export const MAX_CONTRACT_FUNCTIONS = 32

/**
 * Maximum number of entries in InstanceParameters, InstanceParameterValues and
 * a Function's Parameters (rippled `maxContractParams`).
 */
export const MAX_CONTRACT_PARAMS = 8

/** Maximum ContractCode size in bytes (rippled `kMaxBytecodeSizeLimit`). */
export const MAX_CONTRACT_CODE_BYTES = 200000

/** Maximum Gas of a ContractCall (rippled `kMaxGasLimit`). */
export const MAX_CONTRACT_GAS = 2000000

const MAX_UINT32 = 0xffffffff
const HASH256_HEX_LENGTH = 64
/** Hex characters per byte. */
export const HEX_CHARS_PER_BYTE = 2

/**
 * The type names a ParameterType or ParameterValue may carry, as rippled's
 * STDataType and STData parse them from JSON.
 */
export const CONTRACT_DATA_TYPES = [
  'UINT8',
  'UINT16',
  'UINT32',
  'UINT64',
  'UINT128',
  'UINT160',
  'UINT192',
  'UINT256',
  'VL',
  'ACCOUNT',
  'AMOUNT',
  'ISSUE',
  'CURRENCY',
  'NUMBER',
] as const

/** A type name of {@link CONTRACT_DATA_TYPES}. */
export type ContractDataTypeName = (typeof CONTRACT_DATA_TYPES)[number]

/**
 * A DATATYPE field (ParameterType): the type of a contract parameter.
 */
export interface ParameterType {
  type: ContractDataTypeName
}

/**
 * The JSON value of a DATA field: a number for UINT8/16/32, a string for the
 * hex, account, number and UINT64 types, an Amount for AMOUNT and a Currency
 * for ISSUE.
 */
export type ParameterValueData = number | string | Amount | MPTAmount | Currency

/**
 * A DATA field (ParameterValue): a typed value of a contract parameter.
 */
export interface ParameterValue {
  type: ContractDataTypeName
  value: ParameterValueData
}

/**
 * Values of a contract parameter's ParameterFlag.
 *
 * @category Transaction Flags
 */
export enum ContractParameterFlags {
  /** The parameter sends its AMOUNT value from the caller to the contract. */
  tfSendAmount = 0x00010000,
  /** The parameter sends the NFToken its UINT256 value names to the contract. */
  tfSendNFToken = 0x00020000,
  /** Refused by rippled's preflight (temDISABLED). */
  tfAuthorizeToken = 0x00040000,
}

/**
 * A Parameter inner object: a parameter of a Function, or an argument of a
 * ContractCall.
 */
export interface ContractParameter {
  Parameter: {
    ParameterFlag?: number
    ParameterType?: ParameterType
    ParameterValue?: ParameterValue
  }
}

/**
 * A Function inner object: an exported function of a contract.
 */
export interface ContractFunction {
  Function: {
    /** The function's name, hex encoded. */
    FunctionName: string
    Parameters?: ContractParameter[]
  }
}

/**
 * An InstanceParameter inner object: a parameter of a contract instance.
 */
export interface ContractInstanceParameter {
  InstanceParameter: {
    ParameterFlag: number
    ParameterType: ParameterType
  }
}

/**
 * An InstanceParameterValue inner object: the value of a contract instance
 * parameter.
 */
export interface ContractInstanceParameterValue {
  InstanceParameterValue: {
    ParameterFlag: number
    ParameterValue: ParameterValue
  }
}

/** The fields of a Parameter inner object. */
export type ParameterFields = ContractParameter['Parameter']

/**
 * Verify a value is a hex string of whole bytes.
 *
 * @param value - The value to check.
 * @returns Whether the value is an even-length hex string.
 */
export function isHexBlob(value: unknown): value is string {
  return (
    isString(value) && isHex(value) && value.length % HEX_CHARS_PER_BYTE === 0
  )
}

/**
 * Verify a value is a 256-bit hash in hex.
 *
 * @param value - The value to check.
 * @returns Whether the value is 64 hex characters.
 */
export function isHash256(value: unknown): value is string {
  return isString(value) && isHex(value) && value.length === HASH256_HEX_LENGTH
}

/**
 * Verify a value is an unsigned 32-bit integer.
 *
 * @param value - The value to check.
 * @returns Whether the value is an integer from 0 to 2^32 - 1.
 */
export function isUInt32(value: unknown): value is number {
  return (
    isNumber(value) &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= MAX_UINT32
  )
}

/**
 * Verify every set bit of `flags` is one of `allowed`.
 *
 * @param flags - An unsigned 32-bit flags value.
 * @param allowed - The single-bit flags that may be set.
 * @returns Whether no other bit is set.
 */
export function hasOnlyFlags(flags: number, allowed: number[]): boolean {
  const known = allowed
    .filter((flag) => isFlagEnabled(flags, flag))
    .reduce((sum, flag) => sum + flag, 0)
  return flags === known
}

/**
 * Verify a ParameterFlag holds only parameter flags (rippled
 * `isValidParameterFlag`).
 *
 * @param flag - The ParameterFlag value.
 * @returns Whether the flag is valid.
 */
export function isValidParameterFlag(flag: number): boolean {
  return hasOnlyFlags(flag, [
    ContractParameterFlags.tfSendAmount,
    ContractParameterFlags.tfSendNFToken,
    ContractParameterFlags.tfAuthorizeToken,
  ])
}

function isDataTypeName(value: unknown): value is ContractDataTypeName {
  return (
    isString(value) &&
    CONTRACT_DATA_TYPES.some((typeName) => typeName === value)
  )
}

/**
 * Verify the form of a ParameterType (DATATYPE) field.
 *
 * @param value - The value to check.
 * @returns Whether the value is `{ type }` with a known type name.
 */
export function isParameterType(value: unknown): value is ParameterType {
  return isRecord(value) && isDataTypeName(value.type)
}

/**
 * Verify the form of a ParameterValue (DATA) field.
 *
 * @param value - The value to check.
 * @returns Whether the value is `{ type, value }` with a known type name and a
 * non-null value.
 */
export function isParameterValue(value: unknown): value is ParameterValue {
  return isRecord(value) && isDataTypeName(value.type) && value.value != null
}

function isOptional<T>(
  value: unknown,
  guard: (inp: unknown) => inp is T,
): boolean {
  return value === undefined || guard(value)
}

/**
 * Verify the form of a Parameter inner object.
 *
 * @param value - The value to check.
 * @returns Whether the value is a well-formed {@link ContractParameter}.
 */
export function isContractParameter(
  value: unknown,
): value is ContractParameter {
  if (!isRecord(value) || !isRecord(value.Parameter)) {
    return false
  }
  const inner = value.Parameter
  return (
    isOptional(inner.ParameterFlag, isUInt32) &&
    isOptional(inner.ParameterType, isParameterType) &&
    isOptional(inner.ParameterValue, isParameterValue)
  )
}

/**
 * Verify the form of an array of Parameter inner objects.
 *
 * @param value - The value to check.
 * @returns Whether the value is an array of {@link ContractParameter}.
 */
export function isContractParameters(
  value: unknown,
): value is ContractParameter[] {
  return isArray(value) && value.every(isContractParameter)
}

/**
 * Verify the form of a Function inner object.
 *
 * @param value - The value to check.
 * @returns Whether the value is a well-formed {@link ContractFunction}.
 */
export function isContractFunction(value: unknown): value is ContractFunction {
  if (!isRecord(value) || !isRecord(value.Function)) {
    return false
  }
  const inner = value.Function
  return (
    isHexBlob(inner.FunctionName) &&
    isOptional(inner.Parameters, isContractParameters)
  )
}

/**
 * Verify the form of an InstanceParameter inner object.
 *
 * @param value - The value to check.
 * @returns Whether the value is a well-formed {@link ContractInstanceParameter}.
 */
export function isContractInstanceParameter(
  value: unknown,
): value is ContractInstanceParameter {
  if (!isRecord(value) || !isRecord(value.InstanceParameter)) {
    return false
  }
  const inner = value.InstanceParameter
  return isUInt32(inner.ParameterFlag) && isParameterType(inner.ParameterType)
}

/**
 * Verify the form of an InstanceParameterValue inner object.
 *
 * @param value - The value to check.
 * @returns Whether the value is a well-formed
 * {@link ContractInstanceParameterValue}.
 */
export function isContractInstanceParameterValue(
  value: unknown,
): value is ContractInstanceParameterValue {
  if (!isRecord(value) || !isRecord(value.InstanceParameterValue)) {
    return false
  }
  const inner = value.InstanceParameterValue
  return isUInt32(inner.ParameterFlag) && isParameterValue(inner.ParameterValue)
}

/**
 * Verify the form of an array of ContractFunction.
 *
 * @param value - The value to check.
 * @returns Whether the value is a ContractFunction[].
 */
export function isContractFunctions(
  value: unknown,
): value is ContractFunction[] {
  return isArray(value) && value.every(isContractFunction)
}

/**
 * Verify the form of an array of ContractInstanceParameter.
 *
 * @param value - The value to check.
 * @returns Whether the value is a ContractInstanceParameter[].
 */
export function isContractInstanceParameters(
  value: unknown,
): value is ContractInstanceParameter[] {
  return isArray(value) && value.every(isContractInstanceParameter)
}

/**
 * Verify the form of an array of ContractInstanceParameterValue.
 *
 * @param value - The value to check.
 * @returns Whether the value is a ContractInstanceParameterValue[].
 */
export function isContractInstanceParameterValues(
  value: unknown,
): value is ContractInstanceParameterValue[] {
  return isArray(value) && value.every(isContractInstanceParameterValue)
}

/**
 * The fields ContractCreate and ContractModify share.
 */
export interface ContractCodeFields {
  TransactionType: string
  ContractCode?: string
  ContractHash?: string
  Functions?: ContractFunction[]
  InstanceParameters?: ContractInstanceParameter[]
  InstanceParameterValues?: ContractInstanceParameterValue[]
  URI?: string
}
