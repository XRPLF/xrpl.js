import { sha512 } from '@xrplf/isomorphic/sha512'
import { bytesToHex, hexToBytes } from '@xrplf/isomorphic/utils'

const HASH_BYTES = 32

/**
 * Compute a sha512Half Hash of a hex string.
 *
 * @param hex - Hex string to hash.
 * @returns Hash of hex.
 */
function sha512Half(hex: string): string {
  return bytesToHex(sha512(hexToBytes(hex)).slice(0, HASH_BYTES))
}

export default sha512Half
