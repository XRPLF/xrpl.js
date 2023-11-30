export type ByteArray = number[] | Uint8Array

/**
 * Check whether two sequences (e.g. Arrays of numbers) are equal.
 *
 * @param arr1 - One of the arrays to compare.
 * @param arr2 - The other array to compare.
 */
export function arrayEqual(arr1: ByteArray, arr2: ByteArray): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }
  return arr1.every((value, index) => value === arr2[index])
}

/**
 * Check whether a value is a scalar
 *
 * @param val - The value to check.
 */
function isScalar(val: ByteArray | number): val is number {
  return typeof val === 'number'
}

/**
 * Concatenate all `arguments` into a single array. Each argument can be either
 * a single element or a sequence, which has a `length` property and supports
 * element retrieval via sequence[ix].
 *
 * > concatArgs(1, [2, 3], Uint8Array.from([4,5]), new Uint8Array([6, 7]));
 * [1,2,3,4,5,6,7]
 *
 * @param args - Concatenate of these args into a single array.
 * @returns Array of concatenated arguments
 */

export function concatArgs(...args: Array<number | ByteArray>): number[] {
  return args.flatMap((arg) => {
    return isScalar(arg) ? [arg] : Array.from(arg)
  })
}
