import { Input } from './types'

/**
 * Normalize a string, number array, or Uint8Array to a string or Uint8Array.
 * Both node and noble lib functions accept these types.
 *
 * @param input - value to normalize
 */
export default function normalizeInput(input: Input): string | Uint8Array {
  return Array.isArray(input) ? new Uint8Array(input) : input
}
