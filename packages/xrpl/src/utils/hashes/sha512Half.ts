import { createHash } from 'crypto'

const HASH_SIZE = 64

/**
 * Compute a sha512Half Hash of a hex string.
 *
 * @param hex - Hex string to hash.
 * @returns Hash of hex.
 */
function sha512Half(hex: string): string {
  return createHash('sha512')
    .update(Buffer.from(hex, 'hex'))
    .digest('hex')
    .toUpperCase()
    .slice(0, HASH_SIZE)
}

export default sha512Half
