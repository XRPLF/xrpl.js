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
