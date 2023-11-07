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
  iteratee: (value: T, index: number, array: T[]) => string | number,
): Record<string | number, T[]> {
  // eslint-disable-next-line max-params -- need all the params for the fallback
  function predicate(
    acc: Record<string | number, T[]>,
    value: T,
    index: number,
    arrayReference: T[],
  ): Record<string | number, T[]> {
    const key = iteratee(value, index, arrayReference) || 0
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Find existing group or create a new one
    const group = acc[key] || []
    group.push(value)
    acc[key] = group
    return acc
  }

  return array.reduce(predicate, {})
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
