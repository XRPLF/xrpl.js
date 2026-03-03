import { Comparable } from './serialized-type'

/**
 * Compare numbers and bigInts n1 and n2
 *
 * @param n1 First object to compare
 * @param n2 Second object to compare
 * @returns -1, 0, or 1, depending on how the two objects compare
 */
function compare(n1: number | bigint, n2: number | bigint): number {
  return n1 < n2 ? -1 : n1 == n2 ? 0 : 1
}

/**
 * Base class for serializing and deserializing signed integers.
 */
abstract class Int extends Comparable<Int | number> {
  protected static width: number

  constructor(bytes: Uint8Array) {
    super(bytes)
  }

  /**
   * Overload of compareTo for Comparable
   *
   * @param other other Int to compare this to
   * @returns -1, 0, or 1 depending on how the objects relate to each other
   */
  compareTo(other: Int | number): number {
    return compare(this.valueOf(), other.valueOf())
  }

  /**
   * Convert an Int object to JSON
   *
   * @returns number or string represented by this.bytes
   */
  toJSON(): number | string {
    const val = this.valueOf()
    return typeof val === 'number' ? val : val.toString()
  }

  /**
   * Get the value of the Int represented by this.bytes
   *
   * @returns the value
   */
  abstract valueOf(): number | bigint

  /**
   * Validate that a number is within the specified signed integer range
   *
   * @param typeName The name of the type (for error messages)
   * @param val The number to validate
   * @param min The minimum allowed value
   * @param max The maximum allowed value
   * @throws Error if the value is out of range
   */
  // eslint-disable-next-line max-params -- for error clarity in browsers
  static checkIntRange(
    typeName: string,
    val: number | bigint,
    min: number | bigint,
    max: number | bigint,
  ): void {
    if (val < min || val > max) {
      throw new Error(
        `Invalid ${typeName}: ${val} must be >= ${min} and <= ${max}`,
      )
    }
  }
}

export { Int }
