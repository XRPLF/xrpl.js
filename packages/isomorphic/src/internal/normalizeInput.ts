import { Input } from './types'

/**
 * Normalize a string, number array, or Uint8Array to a Uint8Array.
 * Strings are converted to Uint8Array using UTF-8 encoding.
 *
 * @param input - value to normalize
 */
export default function normalizeInput(input: Input): Uint8Array {
  if (Array.isArray(input)) {
    return new Uint8Array(input)
  }
  if (typeof input === 'string') {
    return new TextEncoder().encode(input)
  }
  return input
}
