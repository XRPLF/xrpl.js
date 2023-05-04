const HASH_BYTES = 32

const sha512Half = (() => {
  const isBrowser = typeof window !== 'undefined'

  if (isBrowser) {
    const { sha512 } = require('@noble/hashes/sha512')
    const { bytesToHex, hexToBytes } = require('@noble/hashes/utils')

    return function sha512Half(hex: string): string {
      const digestHalf = sha512(hexToBytes(hex)).slice(0, HASH_BYTES)
      return bytesToHex(digestHalf).toUpperCase()
    }
  } else {
    const crypto = require('crypto')

    return function sha512Half(hex: string): string {
      const hash = crypto.createHash('sha512')
      hash.update(Buffer.from(hex, 'hex'))
      const digestHalf = hash.digest().slice(0, HASH_BYTES)
      return digestHalf.toString('hex').toUpperCase()
    }
  }
})()


/**
 * Compute a sha512Half Hash of a hex string.
 *
 * @param hex - Hex string to hash.
 * @returns Hash of hex.
 */
export default sha512Half
