import { classicAddressToXAddress } from 'ripple-address-codec'
import { deriveKeypair, deriveAddress } from 'ripple-keypairs'

interface DeriveOptions {
  publicKey: string
  tag: number | false
  test: boolean
}

/**
 * Derive an X-Address from a public key and a destination tag.
 *
 * @param options - Public key and destination tag to encode as an X-Address.
 * @returns X-Address.
 */
function deriveXAddress(options: DeriveOptions): string {
  const classicAddress = deriveAddress(options.publicKey)
  return classicAddressToXAddress(classicAddress, options.tag, options.test)
}

export { deriveKeypair, deriveXAddress }
