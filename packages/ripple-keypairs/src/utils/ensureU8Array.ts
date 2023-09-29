import { HexOrU8Array } from '../types'
import { hexToBytes } from '@xrplf/isomorphic/utils'

/**
 * Takes hex string or Uint8Array, converts to Uint8Array.
 * Validates output length.
 * Will throw error for other types.
 *
 * @param hexOrU8Array - hex string or Uint8Array
 * @param title - descriptive title for an error e.g. 'private key'
 * @param expectedLength - optional, will compare to result array's length
 * @returns Uint8Array from parsed hex or same instance of Uint8Array
 *
 * @throws Error when hex string malformed or length unexpected
 *
 */
export default function ensureU8Array(
  hexOrU8Array: HexOrU8Array,
  title: string,
  expectedLength?: number,
): Uint8Array {
  let res: Uint8Array
  if (typeof hexOrU8Array === 'string') {
    try {
      res = hexToBytes(hexOrU8Array)
    } catch (error) {
      throw new Error(
        `${title} must be valid hex string, got "${hexOrU8Array}". Cause: ${error}`,
      )
    }
  } else if (hexOrU8Array instanceof Uint8Array) {
    res = hexOrU8Array
  } else {
    throw new Error(`${title} must be hex string or Uint8Array`)
  }
  const len = res.length
  if (typeof expectedLength === 'number' && len !== expectedLength) {
    throw new Error(`${title} expected ${expectedLength} bytes, got ${len}`)
  }
  return res
}
