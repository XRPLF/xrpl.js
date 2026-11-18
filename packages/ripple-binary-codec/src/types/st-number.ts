/* eslint-disable complexity -- required for various checks */
import { BinaryParser } from '../serdes/binary-parser'
import { SerializedType } from './serialized-type'
import { writeInt32BE, writeInt64BE, readInt32BE, readInt64BE } from '../utils'

/**
 * Constants for mantissa and exponent normalization per XRPL Number spec.
 * These define allowed magnitude for mantissa and exponent after normalization.
 */
const MIN_MANTISSA = BigInt('1000000000000000000') // 10^18
const MAX_MANTISSA = BigInt('9999999999999999999') // 10^19 - 1
const MAX_INT64 = BigInt('9223372036854775807') // 2^63 - 1, max signed 64-bit integer
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
  // eslint-disable-next-line prefer-named-capture-group
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

  // Remove trailing zeros from mantissa and adjust exponent
  while (mantissaStr.length > 1 && mantissaStr.endsWith('0')) {
    mantissaStr = mantissaStr.slice(0, -1)
    exponent += 1
  }

  let mantissa = BigInt(mantissaStr)
  if (sign === '-') mantissa = -mantissa
  const isNegative = mantissa < BigInt(0)

  return { mantissa, exponent, isNegative }
}

/**
 * Normalize the mantissa and exponent to XRPL constraints.
 *
 * Ensures that after normalization, the mantissa is between MIN_MANTISSA and MAX_INT64.
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

  // Handle zero
  if (m === BigInt(0)) {
    return { mantissa: BigInt(0), exponent: DEFAULT_VALUE_EXPONENT }
  }

  // Grow mantissa until it reaches MIN_MANTISSA
  while (m < MIN_MANTISSA && exponent > MIN_EXPONENT) {
    exponent -= 1
    m *= BigInt(10)
  }

  let lastDigit: bigint | null = null

  // Shrink mantissa until it fits within MAX_MANTISSA
  while (m > MAX_MANTISSA) {
    if (exponent >= MAX_EXPONENT) {
      throw new Error('Mantissa and exponent are too large')
    }
    exponent += 1
    lastDigit = m % BigInt(10)
    m /= BigInt(10)
  }

  // Handle underflow: if exponent too small or mantissa too small, throw error
  if (exponent < MIN_EXPONENT || m < MIN_MANTISSA) {
    throw new Error('Underflow: value too small to represent')
  }

  // Handle overflow: if exponent exceeds MAX_EXPONENT after growing.
  if (exponent > MAX_EXPONENT) {
    throw new Error('Exponent overflow: value too large to represent')
  }

  // Handle overflow: if mantissa exceeds MAX_INT64 (2^63-1) after growing.
  if (m > MAX_INT64) {
    if (exponent >= MAX_EXPONENT) {
      throw new Error('Exponent overflow: value too large to represent')
    }
    exponent += 1
    lastDigit = m % BigInt(10)
    m /= BigInt(10)
  }

  if (lastDigit != null && lastDigit >= BigInt(5)) {
    m += BigInt(1)
    // After rounding, mantissa may exceed MAX_INT64 again
    if (m > MAX_INT64) {
      if (exponent >= MAX_EXPONENT) {
        throw new Error('Exponent overflow: value too large to represent')
      }
      lastDigit = m % BigInt(10)
      exponent += 1
      m /= BigInt(10)
      if (lastDigit >= BigInt(5)) {
        m += BigInt(1)
      }
    }
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
    const { mantissa, exponent } = extractNumberPartsFromString(val)
    const { mantissa: normalizedMantissa, exponent: normalizedExponent } =
      normalize(mantissa, exponent)

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
  toJSON(): string {
    const b = this.bytes
    if (!b || b?.length !== 12)
      throw new Error('STNumber internal bytes not set or wrong length')

    // Signed 64-bit mantissa
    const mantissa = readInt64BE(b, 0)
    // Signed 32-bit exponent
    let exponent = readInt32BE(b, 8)

    // Special zero: XRPL encodes canonical zero as mantissa=0, exponent=DEFAULT_VALUE_EXPONENT.
    if (mantissa === BigInt(0) && exponent === DEFAULT_VALUE_EXPONENT) {
      return '0'
    }

    const isNegative = mantissa < BigInt(0)
    let mantissaAbs = isNegative ? -mantissa : mantissa

    // If mantissa < MIN_MANTISSA, it was shrunk for int64 serialization (mantissa > 2^63-1).
    // Restore it for proper string rendering to match rippled's internal representation.
    if (mantissaAbs !== BigInt(0) && mantissaAbs < MIN_MANTISSA) {
      mantissaAbs *= BigInt(10)
      exponent -= 1
    }

    // For large mantissa range (default), rangeLog = 18
    const rangeLog = 18

    // Use scientific notation for exponents that are too small or too large
    // Condition from rippled: exponent != 0 AND (exponent < -(rangeLog + 10) OR exponent > -(rangeLog - 10))
    // For rangeLog = 18: exponent != 0 AND (exponent < -28 OR exponent > -8)
    if (
      exponent !== 0 &&
      (exponent < -(rangeLog + 10) || exponent > -(rangeLog - 10))
    ) {
      // Strip trailing zeros from mantissa (matches rippled behavior)
      let exp = exponent
      while (
        mantissaAbs !== BigInt(0) &&
        mantissaAbs % BigInt(10) === BigInt(0) &&
        exp < MAX_EXPONENT
      ) {
        mantissaAbs /= BigInt(10)
        exp += 1
      }
      const sign = isNegative ? '-' : ''
      return `${sign}${mantissaAbs}e${exp}`
    }

    // Decimal rendering for -(rangeLog + 10) <= exponent <= -(rangeLog - 10)
    // i.e., -28 <= exponent <= -8, or exponent == 0
    const padPrefix = rangeLog + 12 // 30
    const padSuffix = rangeLog + 8 // 26

    const mantissaStr = mantissaAbs.toString()
    const rawValue = '0'.repeat(padPrefix) + mantissaStr + '0'.repeat(padSuffix)
    const offset = exponent + padPrefix + rangeLog + 1 // exponent + 49

    const integerPart = rawValue.slice(0, offset).replace(/^0+/, '') || '0'
    const fractionPart = rawValue.slice(offset).replace(/0+$/, '')

    return `${isNegative ? '-' : ''}${integerPart}${
      fractionPart ? '.' + fractionPart : ''
    }`
  }
}
