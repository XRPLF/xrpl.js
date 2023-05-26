import { xAddressToClassicAddress, isValidXAddress } from 'ripple-address-codec'

/**
 * If an address is an X-Address, converts it to a classic address.
 *
 * @param account - A classic address or X-address.
 * @returns The account's classic address.
 * @throws Error if the X-Address has an associated tag.
 */
export function ensureClassicAddress(account: string): string {
  if (isValidXAddress(account)) {
    const { classicAddress, tag } = xAddressToClassicAddress(account)

    /*
     * Except for special cases, X-addresses used for requests
     * must not have an embedded tag. In other words,
     * `tag` should be `false`.
     */
    if (tag !== false) {
      throw new Error(
        'This command does not support the use of a tag. Use an address without a tag.',
      )
    }

    // For rippled requests that use an account, always use a classic address.
    return classicAddress
  }
  return account
}

/**
 * Determines whether a rippled version (source) is earlier than another (target).
 *
 * @param source - The source rippled version.
 * @param target - The target rippled version.
 * @returns true if source is earlier, false otherwise.
 */
// eslint-disable-next-line max-lines-per-function, max-statements -- Disable for this utils functions.
export function isEarlierVersion(source: string, target: string): boolean {
  if (source === target) {
    return false
  }
  const sourceDecomp = source.split('.')
  const targetDecomp = target.split('.')
  const sourceMajor = parseInt(sourceDecomp[0], 10)
  const sourceMinor = parseInt(sourceDecomp[1], 10)
  const targetMajor = parseInt(targetDecomp[0], 10)
  const targetMinor = parseInt(targetDecomp[1], 10)
  // Compare major version
  if (sourceMajor !== targetMajor) {
    return sourceMajor < targetMajor
  }
  // Compare minor version
  if (sourceMinor !== targetMinor) {
    return sourceMinor < targetMinor
  }
  const sourcePatch = sourceDecomp[2].split('-')
  const targetPatch = targetDecomp[2].split('-')

  const sourcePatchVersion = parseInt(sourcePatch[0], 10)
  const targetPatchVersion = parseInt(targetPatch[0], 10)

  // Compare patch version
  if (sourcePatchVersion !== targetPatchVersion) {
    return sourcePatchVersion < targetPatchVersion
  }

  // Compare release version
  if (sourcePatch.length !== targetPatch.length) {
    return sourcePatch.length > targetPatch.length
  }

  if (sourcePatch.length === 2) {
    // Compare different release types
    if (!sourcePatch[1][0].startsWith(targetPatch[1][0])) {
      return sourcePatch[1] < targetPatch[1]
    }
    // Compare beta version
    if (sourcePatch[1].startsWith('b')) {
      return (
        parseInt(sourcePatch[1].slice(1), 10) <
        parseInt(targetPatch[1].slice(1), 10)
      )
    }
    // Compare rc version
    return (
      parseInt(sourcePatch[1].slice(2), 10) <
      parseInt(targetPatch[1].slice(2), 10)
    )
  }

  return false
}
