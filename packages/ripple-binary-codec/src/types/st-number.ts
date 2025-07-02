import { BinaryParser } from '../serdes/binary-parser'
import { SerializedType } from './serialized-type'
import { writeInt32BE, writeInt64BE, readInt32BE, readInt64BE } from '../utils'

/**
 * Constants for mantissa and exponent normalization per XRPL Number spec.
 * These define allowed magnitude for mantissa and exponent after normalization.
 */
const MIN_MANTISSA = BigInt('1000000000000000')
const MAX_MANTISSA = BigInt('9999999999999999')
const MIN_EXPONENT = -32768
const MAX_EXPONENT = 32768
const DEFAULT_VALUE_EXPONENT = -2147483648

/**
 * Extract mantissa, exponent, and sign from a number string.
 *
 * @param val - The string representing the number (may be integer, decimal, or scientific notation).
 * @returns Object containing mantissa (BigInt), exponent (number), and isNegative (boolean).
 * @throws Error if the string cannot be parsed as a valid number.
 *
 * Examples:
 *   '123'        -> { mantissa: 123n, exponent: 0, isNegative: false }
 *   '-00123.45'  -> { mantissa: -12345n, exponent: -2, isNegative: true }
 *   '+7.1e2'     -> { mantissa: 71n, exponent: -1 + 2 = 1, isNegative: false }
 */
function extractNumberPartsFromString(val: string): {
  mantissa: bigint
  exponent: number
  isNegative: boolean
} {
  /**
   * Regex for parsing decimal/float/scientific number strings with optional sign, integer, decimal, and exponent parts.
   *
   * Pattern: /^([-+]?)([0-9]+)(?:\.([0-9]+))?(?:[eE]([+-]?[0-9]+))?$/
   *
   * Breakdown:
   *   1. ([-+]?)         - Optional '+' or '-' sign at the start.
   *   2. ([0-9]+)        - Integer part: one or more digits (leading zeros allowed).
   *   3. (?:\.([0-9]+))? - Optional decimal point followed by one or more digits.
   *   4. (?:[eE]([+-]?[0-9]+))? - Optional exponent, starting with 'e' or 'E', optional sign, and digits.
   *
   * Notes:
   *   - Leading zeros are accepted and normalized by code after parsing.
   *   - Empty decimal ('123.') and missing integer ('.456') are NOT matched—must be fully specified.
   */
  const regex = /^([-+]?)([0-9]+)(?:\.([0-9]+))?(?:[eE]([+-]?[0-9]+))?$/
  const match = regex.exec(val)
  if (!match) throw new Error(`Unable to parse number from string: ${val}`)

  const [, sign, intPart, fracPart, expPart] = match
  // Remove leading zeros (unless the entire intPart is zeros)
  const cleanIntPart = intPart.replace(/^0+(?=\d)/, '') || '0'

  let mantissaStr = cleanIntPart
  let exponent = 0

  if (fracPart) {
    mantissaStr += fracPart
    exponent -= fracPart.length
  }
  if (expPart) exponent += parseInt(expPart, 10)

  let mantissa = BigInt(mantissaStr)
  if (sign === '-') mantissa = -mantissa
  const isNegative = mantissa < BigInt(0)

  return { mantissa, exponent, isNegative }
}

/**
 * Normalize the mantissa and exponent to XRPL constraints.
 *
 * Ensures that after normalization, the mantissa is between MIN_MANTISSA and MAX_MANTISSA (unless zero).
 * Adjusts the exponent as needed by shifting the mantissa left/right (multiplying/dividing by 10).
 *
 * @param mantissa - The unnormalized mantissa (BigInt).
 * @param exponent - The unnormalized exponent (number).
 * @returns An object with normalized mantissa and exponent.
 * @throws Error if the number cannot be normalized within allowed exponent range.
 */
function normalize(
  mantissa: bigint,
  exponent: number,
): { mantissa: bigint; exponent: number } {
  let m = mantissa < BigInt(0) ? -mantissa : mantissa
  const isNegative = mantissa < BigInt(0)

  while (m !== BigInt(0) && m < MIN_MANTISSA && exponent > MIN_EXPONENT) {
    exponent -= 1
    m *= BigInt(10)
  }
  while (m > MAX_MANTISSA) {
    if (exponent >= MAX_EXPONENT)
      throw new Error('Mantissa and exponent are too large')
    exponent += 1
    m /= BigInt(10)
  }
  if (isNegative) m = -m
  return { mantissa: m, exponent }
}

/**
 * STNumber: Encodes XRPL's "Number" type.
 *
 * - Always encoded as 12 bytes: 8-byte signed mantissa, 4-byte signed exponent, both big-endian.
 * - Can only be constructed from a valid number string or another STNumber instance.
 *
 * Usage:
 *   STNumber.from("1.2345e5")
 *   STNumber.from("-123")
 *   STNumber.fromParser(parser)
 */
export class STNumber extends SerializedType {
  /** 12 zero bytes, represents canonical zero. */
  static defaultBytes = new Uint8Array(12)

  /**
   * Construct a STNumber from 12 bytes (8 for mantissa, 4 for exponent).
   * @param bytes - 12-byte Uint8Array
   * @throws Error if input is not a Uint8Array of length 12.
   */
  constructor(bytes?: Uint8Array) {
    const used = bytes ?? STNumber.defaultBytes
    if (!(used instanceof Uint8Array) || used.length !== 12) {
      throw new Error(
        `STNumber must be constructed from a 12-byte Uint8Array, got ${used?.length}`,
      )
    }
    super(used)
  }

  /**
   * Construct from a number string (or another STNumber).
   *
   * @param value - A string, or STNumber instance.
   * @returns STNumber instance.
   * @throws Error if not a string or STNumber.
   */
  static from(value: unknown): STNumber {
    if (value instanceof STNumber) {
      return value
    }
    if (typeof value === 'string') {
      return STNumber.fromValue(value)
    }
    throw new Error(
      'STNumber.from: Only string or STNumber instance is supported',
    )
  }

  /**
   * Construct from a number string (integer, decimal, or scientific notation).
   * Handles normalization to XRPL Number constraints.
   *
   * @param val - The number as a string (e.g. '1.23', '-123e5').
   * @returns STNumber instance
   * @throws Error if val is not a valid number string.
   */
  static fromValue(val: string): STNumber {
    const { mantissa, exponent, isNegative } = extractNumberPartsFromString(val)
    let normalizedMantissa: bigint
    let normalizedExponent: number

    if (mantissa === BigInt(0) && exponent === 0 && !isNegative) {
      normalizedMantissa = BigInt(0)
      normalizedExponent = DEFAULT_VALUE_EXPONENT
    } else {
      ;({ mantissa: normalizedMantissa, exponent: normalizedExponent } =
        normalize(mantissa, exponent))
    }

    const bytes = new Uint8Array(12)
    writeInt64BE(bytes, normalizedMantissa, 0)
    writeInt32BE(bytes, normalizedExponent, 8)
    return new STNumber(bytes)
  }

  /**
   * Read a STNumber from a BinaryParser stream (12 bytes).
   * @param parser - BinaryParser positioned at the start of a number
   * @returns STNumber instance
   */
  static fromParser(parser: BinaryParser): STNumber {
    return new STNumber(parser.read(12))
  }

  /**
   * Convert this STNumber to a normalized string representation.
   * The output is decimal or scientific notation, depending on exponent range.
   * Follows XRPL convention: zero is "0", other values are normalized to a canonical string.
   *
   * @returns String representation of the value
   */
  // eslint-disable-next-line complexity -- required
  toJSON(): string {
    const b = this.bytes
    if (!b || b.length !== 12)
      throw new Error('STNumber internal bytes not set or wrong length')

    // Signed 64-bit mantissa
    const mantissa = readInt64BE(b, 0)
    // Signed 32-bit exponent
    const exponent = readInt32BE(b, 8)

    // Special zero: XRPL encodes canonical zero as mantissa=0, exponent=DEFAULT_VALUE_EXPONENT.
    if (mantissa === BigInt(0) && exponent === DEFAULT_VALUE_EXPONENT) {
      return '0'
    }
    if (exponent === 0) return mantissa.toString()

    // Use scientific notation for small/large exponents, decimal otherwise
    if (exponent < -25 || exponent > -5) {
      return `${mantissa}e${exponent}`
    }

    // Decimal rendering for -25 <= exp <= -5
    const isNegative = mantissa < BigInt(0)
    const mantissaAbs = mantissa < BigInt(0) ? -mantissa : mantissa

    const padPrefix = 27
    const padSuffix = 23
    const mantissaStr = mantissaAbs.toString()
    const rawValue = '0'.repeat(padPrefix) + mantissaStr + '0'.repeat(padSuffix)
    const OFFSET = exponent + 43
    const integerPart = rawValue.slice(0, OFFSET).replace(/^0+/, '') || '0'
    const fractionPart = rawValue.slice(OFFSET).replace(/0+$/, '')

    return `${isNegative ? '-' : ''}${integerPart}${
      fractionPart ? '.' + fractionPart : ''
    }`
  }
}
