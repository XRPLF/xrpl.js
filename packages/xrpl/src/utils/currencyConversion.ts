import { convertStringToHex, convertHexToString } from './stringConversion'

/**
 * Convert a currency name to a properly formatted currency code for XRPL.
 * 
 * For currency names of 3 characters or less, returns the name as-is (ASCII).
 * For longer names, converts to a 40-character hex-encoded string.
 *
 * @param currencyName - The human-readable currency name (e.g., "USD", "MyCustomToken")
 * @returns The properly formatted currency code for use in XRPL transactions
 * @throws Error if the currency name is invalid or too long
 * 
 * @example
 * ```typescript
 * currencyNameToCode("USD")          // Returns: "USD"
 * currencyNameToCode("EUR")          // Returns: "EUR"  
 * currencyNameToCode("MyCustomToken") // Returns: "4D79437573746F6D546F6B656E000000000000000000000000"
 * ```
 */
export function currencyNameToCode(currencyName: string): string {
  if (typeof currencyName !== 'string') {
    throw new Error('Currency name must be a string')
  }

  if (currencyName.length === 0) {
    throw new Error('Currency name cannot be empty')
  }

  if (currencyName === 'XRP') {
    throw new Error('XRP cannot be used as a currency code')
  }

  // For names 3 characters or less, use as-is (standard ASCII codes like USD, EUR)
  if (currencyName.length <= 3) {
    return currencyName.toUpperCase()
  }

  // For longer names, convert to hex string
  const hexString = convertStringToHex(currencyName).toUpperCase()
  
  // Check if the hex string is too long (more than 40 characters = 20 bytes)
  if (hexString.length > 40) {
    throw new Error(`Currency name "${currencyName}" is too long. Maximum length is 20 bytes when UTF-8 encoded.`)
  }
  
  // Pad to exactly 40 characters (20 bytes) with zeros
  return hexString.padEnd(40, '0')
}

/**
 * Convert a currency code back to a human-readable currency name.
 * 
 * For 3-character ASCII codes, returns as-is.
 * For 40-character hex codes, converts back to the original string.
 *
 * @param currencyCode - The currency code from XRPL (e.g., "USD" or hex string)
 * @returns The human-readable currency name
 * @throws Error if the currency code is invalid
 * 
 * @example
 * ```typescript
 * currencyCodeToName("USD")                                           // Returns: "USD"
 * currencyCodeToName("4D79437573746F6D546F6B656E000000000000000000000000") // Returns: "MyCustomToken"
 * ```
 */
export function currencyCodeToName(currencyCode: string): string {
  if (typeof currencyCode !== 'string') {
    throw new Error('Currency code must be a string')
  }

  if (currencyCode.length === 0) {
    throw new Error('Currency code cannot be empty')
  }

  if (currencyCode === 'XRP') {
    return 'XRP'
  }

  // If it's a short code (3 characters or less), return as-is
  if (currencyCode.length <= 3) {
    return currencyCode
  }

  // If it's a 40-character hex string, convert back to string
  if (currencyCode.length === 40) {
    // Check if it's valid hex
    if (!/^[0-9A-Fa-f]+$/u.test(currencyCode)) {
      throw new Error('Invalid currency code: not valid hexadecimal')
    }

    try {
      // Remove trailing zeros and convert from hex
      const trimmedHex = currencyCode.replace(/0+$/u, '')
      if (trimmedHex.length === 0) {
        throw new Error('Invalid currency code: empty after removing padding')
      }
      
      return convertHexToString(trimmedHex)
    } catch (error) {
      throw new Error(`Invalid currency code: ${error instanceof Error ? error.message : 'conversion failed'}`)
    }
  }

  throw new Error('Invalid currency code: must be 3 characters or less, or exactly 40 characters hex')
}

/**
 * Check if a currency code is in standard 3-character ASCII format.
 *
 * @param currencyCode - The currency code to check
 * @returns True if the code is a standard 3-character ASCII format
 * 
 * @example
 * ```typescript
 * isStandardCurrencyCode("USD") // Returns: true
 * isStandardCurrencyCode("EUR") // Returns: true
 * isStandardCurrencyCode("4D79437573746F6D546F6B656E000000000000000000000000") // Returns: false
 * ```
 */
export function isStandardCurrencyCode(currencyCode: string): boolean {
  return typeof currencyCode === 'string' && 
         currencyCode.length <= 3 && 
         currencyCode.length > 0 &&
         currencyCode !== 'XRP'
}

/**
 * Check if a currency code is in hex format (40-character string).
 *
 * @param currencyCode - The currency code to check  
 * @returns True if the code is a valid 40-character hex format
 * 
 * @example
 * ```typescript
 * isHexCurrencyCode("USD") // Returns: false
 * isHexCurrencyCode("4D79437573746F6D546F6B656E000000000000000000000000") // Returns: true
 * ```
 */
export function isHexCurrencyCode(currencyCode: string): boolean {
  return typeof currencyCode === 'string' && 
         currencyCode.length === 40 &&
         /^[0-9A-Fa-f]+$/u.test(currencyCode)
}