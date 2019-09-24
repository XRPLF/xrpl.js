type Sequence = number[] | Buffer | Uint8Array

/**
 * Check whether two sequences (e.g. arrays of numbers) are equal.
 *
 * @param arr1 One of the arrays to compare.
 * @param arr2 The other array to compare.
 */
export function seqEqual(arr1: Sequence, arr2: Sequence): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }

  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i] !== arr2[i]) {
      return false
    }
  }
  return true
}

/**
 * Check whether a value is a sequence (e.g. array of numbers).
 *
 * @param val The value to check.
 */
function isSequence(val: Sequence | number): val is Sequence {
  return (val as Sequence).length !== undefined
}

/**
* Concatenate all `arguments` into a single array. Each argument can be either
* a single element or a sequence, which has a `length` property and supports
* element retrieval via sequence[ix].
*
* > concatArgs(1, [2, 3], Buffer.from([4,5]), new Uint8Array([6, 7]));
*  [1,2,3,4,5,6,7]
*
* @returns {number[]} Array of concatenated arguments
*/
export function concatArgs(...args: (number | Sequence)[]): number[] {
  const ret: number[] = []

  args.forEach(function (arg) {
    if (isSequence(arg)) {
      for (let j = 0; j < arg.length; j++) {
        ret.push(arg[j])
      }
    } else {
      ret.push(arg)
    }
  })
  return ret
}
