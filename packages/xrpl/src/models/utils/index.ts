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
 * @param flags - A number that represents flags enabled.
 * @param checkFlag - A specific flag to check if it's enabled within flags.
 * @returns True if checkFlag is enabled within flags.
 */
export function isFlagEnabled(
  flags: number | object,
  checkFlag: number,
): boolean {
  if (typeof flags === 'object') {
    return false
  }
  // eslint-disable-next-line no-bitwise -- flags need bitwise
  return (BigInt(checkFlag) & BigInt(flags)) === BigInt(checkFlag)
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
