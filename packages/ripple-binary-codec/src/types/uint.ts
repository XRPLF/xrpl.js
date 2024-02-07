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
 * Base class for serializing and deserializing unsigned integers.
 */
abstract class UInt extends Comparable<UInt | number> {
  protected static width: number

  constructor(bytes: Uint8Array) {
    super(bytes)
  }

  /**
   * Overload of compareTo for Comparable
   *
   * @param other other UInt to compare this to
   * @returns -1, 0, or 1 depending on how the objects relate to each other
   */
  compareTo(other: UInt | number): number {
    return compare(this.valueOf(), other.valueOf())
  }

  /**
   * Convert a UInt object to JSON
   *
   * @returns number or string represented by this.bytes
   */
  toJSON(): number | string {
    const val = this.valueOf()
    return typeof val === 'number' ? val : val.toString()
  }

  /**
   * Get the value of the UInt represented by this.bytes
   *
   * @returns the value
   */
  abstract valueOf(): number | bigint

  static checkUintRange(val: number, min: number, max: number): void {
    if (val < min || val > max) {
      throw new Error(
        `Invalid ${this.constructor.name}: ${val} must be >= ${min} and <= ${max}`,
      )
    }
  }
}

export { UInt }
