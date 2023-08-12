import { utf8ToBytes } from '@noble/hashes/utils'
import { hexToBytes, bytesToHex } from '@xrpl/crypto/utils'

/**
 * Converts a string to its hex equivalent. Useful for Memos.
 *
 * @param string - The string to convert to Hex.
 * @returns The Hex equivalent of the string.
 * @category Utilities
 */
function convertStringToHex(string: string): string {
  return bytesToHex(utf8ToBytes(string))
}

/**
 * Converts hex to its string equivalent. Useful to read the Domain field and some Memos.
 *
 * @param hex - The hex to convert to a string.
 * @param encoding - The encoding to use. Defaults to 'utf8' (UTF-8). 'ascii' is also allowed.
 * @returns The converted string.
 * @category Utilities
 */
function convertHexToString(hex: string, encoding = 'utf8'): string {
  return new TextDecoder().decode(hexToBytes(hex))
}

export { convertHexToString, convertStringToHex }
