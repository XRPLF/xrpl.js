import BigNumber from 'bignumber.js'
import { ValidationError } from '../errors'

const SANITY_CHECK = /^[0-9]+$/u

/**
 * Convert an unsigned 64-bit integer string to hex string. Mostly used for the MaximumAmount field
 * in MPTokenIssuanceCreate.
 *
 * @param numberToConvert - Non-negative number string.
 * @returns Amount in hex string.
 * @throws When amount is invalid.
 * @category Utilities
 */
export function mptUint64ToHex(numberToConvert: string): string {
  // convert to base 10 string first for inputs like scientific notation
  const number = new BigNumber(numberToConvert).toString(10)

  // check that the value is valid and actually a number
  if (typeof numberToConvert === 'string' && number === 'NaN') {
    throw new ValidationError(
      `mptUint64ToHex: invalid value '${numberToConvert}', should be a string-encoded number.`,
    )
  }

  // mpts are only whole units
  if (number.includes('.')) {
    throw new ValidationError(
      `mptUint64ToHex: value '${numberToConvert}' has too many decimal places.`,
    )
  }
  if (number.includes('-')) {
    throw new ValidationError(
      `mptUint64ToHex: value '${numberToConvert}' cannot be negative.`,
    )
  }

  if (!SANITY_CHECK.exec(number)) {
    throw new ValidationError(
      `mptUint64ToHex: failed sanity check -` +
        ` value '${numberToConvert}',` +
        ` does not match (^[0-9]+$).`,
    )
  }

  if (Number(BigInt(number) & BigInt('0x8000000000000000')) != 0)
    throw new ValidationError(
      `mptUint64ToHex: invalid value '${numberToConvert}', should be within 63-bit range.`,
    )

  return BigInt(number).toString(16)
}
