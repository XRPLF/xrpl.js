import { classicAddressToXAddress } from 'ripple-address-codec'
import { deriveKeypair, deriveAddress } from 'ripple-keypairs'

/**
 * Derive an X-Address from a public key and a destination tag.
 *
 * @param options - Public key and destination tag to encode as an X-Address.
 * @param options.publicKey - The public key corresponding to an address.
 * @param options.tag - A destination tag to encode into an X-address. False indicates no destination tag.
 * @param options.test - Whether this address is for use in Testnet.
 * @returns X-Address.
 * @category Utilities
 */
function deriveXAddress(options: {
  publicKey: string
  tag: number | false
  test: boolean
}): string {
  const classicAddress = deriveAddress(options.publicKey)
  return classicAddressToXAddress(classicAddress, options.tag, options.test)
}

export { deriveKeypair, deriveAddress, deriveXAddress }
