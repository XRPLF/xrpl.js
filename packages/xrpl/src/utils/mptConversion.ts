import { ValidationError } from '../errors'

/**
 * Convert an amount in XRP to an amount in drops.
 *
 * @param number - Amount in MPT.
 * @returns Amount in drops.
 * @throws When amount in xrp is invalid.
 * @category Utilities
 */
export function mptToHex(number: string): string {
  // mpts are only whole units
  if (number.includes('.')) {
    throw new ValidationError(
      `mptToHex: value '${number}' has too many decimal places.`,
    )
  }

  console.log(BigInt(number))

  if (Number(BigInt(number) & BigInt('0x8000000000000000')) != 0)
    throw new ValidationError(
      `mptToHex: invalid value '${number}', should be within 63-bit range.`,
    )

  return BigInt(number).toString(16)
}
// export function mptToHex(number: number): string {
//   // mpts are only whole units
//   if (number.toString().includes('.')) {
//     throw new ValidationError(
//       `mptToHex: value '${number}' has too many decimal places.`,
//     )
//   }

//   console.log('printttttt', BigInt(number))
//   if (Number(BigInt(number) & BigInt(0x8000000000000000)) != 0)
//     throw new ValidationError(
//       `mptToHex: invalid value '${number}', should be within 63-bit range.`,
//     )

//   return number.toString(16)
// }
