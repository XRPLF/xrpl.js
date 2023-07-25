type ValueOf<T> = T[keyof T]

/**
 * Creates an object composed of keys generated from the results of running each element of collection thru iteratee.
 * The order of grouped values is determined by the order they occur in collection.
 * The corresponding value of each key is an array of elements responsible for generating the key.
 *
 * Similar to lodash's groupBy
 *
 * @param array - array to iterate over
 * @param iteratee - function that returns key of the group to place the item
 *
 * @returns a map of arrays
 */
export function groupBy<T>(
  array: T[],
  iteratee: (value: T, index: number, array: T[]) => string,
): { [p: string]: T[] } {
  // eslint-disable-next-line max-params -- need all the params for the fallback
  return array.reduce<{ [key: string]: T[] }>(function predicate(
    acc,
    value,
    index,
    arrayReference,
  ) {
    ;(acc[iteratee(value, index, arrayReference)] ||= []).push(value)
    return acc
  },
  {})
}

/**
 * Creates an object composed of the own and inherited enumerable string keyed properties of object that
 * predicate doesn't return truthy for.
 *
 * @param obj - Object to have properties removed.
 * @param predicate - function that returns whether the property should be removed from the obj.
 *
 * @returns object
 */
export function omitBy<T extends object>(
  obj: T,
  predicate: (objElement: ValueOf<T>, k: string | number | symbol) => boolean,
): Partial<T> {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- We know the keys are properties of T
  const keys: Array<keyof T> = Object.keys(obj) as Array<keyof T>
  const keysToKeep = keys.filter((kb) => !predicate(obj[kb], kb))
  return keysToKeep.reduce((acc: Partial<T>, key: keyof T) => {
    acc[key] = obj[key]
    return acc
  }, {})
}
