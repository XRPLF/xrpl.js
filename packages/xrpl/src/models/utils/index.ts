import type { Transaction } from '../transactions'

const HEX_REGEX = /^[0-9A-Fa-f]+$/u
export const INTEGER_SANITY_CHECK = /^[0-9]+$/u

/**
 * Verify that all fields of an object are in fields.
 *
 * @param obj - Object to verify fields.
 * @param fields - Fields to verify.
 * @returns True if keys in object are all in fields.
 */
export function onlyHasFields(
  obj: Record<string, unknown>,
  fields: string[],
): boolean {
  return Object.keys(obj).every((key: string) => fields.includes(key))
}

/**
 * Perform bitwise AND (&) to check if a flag is enabled within Flags (as a number).
 *
 * @param Flags - A number that represents flags enabled.
 * @param checkFlag - A specific flag to check if it's enabled within Flags.
 * @returns True if checkFlag is enabled within Flags.
 */
export function isFlagEnabled(Flags: number, checkFlag: number): boolean {
  // eslint-disable-next-line no-bitwise -- flags need bitwise
  return (BigInt(checkFlag) & BigInt(Flags)) === BigInt(checkFlag)
}

/**
 * Determines whether a transaction has a certain flag enabled.
 *
 * @param tx The transaction to check for the flag.
 * @param flag The flag to check.
 * @param flagName The name of the flag to check, used for object flags.
 * @returns Whether `flag` is enabled on `tx`.
 */
export function hasFlag(
  tx: Transaction | Record<string, unknown>,
  flag: number,
  flagName: string,
): boolean {
  if (tx.Flags == null) {
    return false
  }
  if (typeof tx.Flags === 'number') {
    return isFlagEnabled(tx.Flags, flag)
  }
  return tx.Flags[flagName] === true
}

/**
 * Check if string is in hex format.
 *
 * @param str - The string to check if it's in hex format.
 * @returns True if string is in hex format
 */
export function isHex(str: string): boolean {
  return HEX_REGEX.test(str)
}
