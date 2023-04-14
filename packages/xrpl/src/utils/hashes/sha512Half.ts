import { sha512 } from '@noble/hashes/sha512'

const HASH_BYTES = 32

/**
 * Compute a sha512Half Hash of a hex string.
 *
 * @param hex - Hex string to hash.
 * @returns Hash of hex.
 */
function sha512Half(hex: string): string {
  return Buffer.from(sha512(Buffer.from(hex, 'hex')))
    .slice(0, HASH_BYTES)
    .toString('hex')
    .toUpperCase()
}

export default sha512Half
