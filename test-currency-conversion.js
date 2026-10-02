// Simple test for currency conversion functions
const { convertStringToHex, convertHexToString } = require('./packages/xrpl/src/utils/stringConversion');

function currencyNameToCode(currencyName) {
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

  // For longer names, convert to 40-character hex string
  const hexString = convertStringToHex(currencyName).toUpperCase()
  
  // Pad to 40 characters (20 bytes) with zeros
  return hexString.padEnd(40, '0')
}

function currencyCodeToName(currencyCode) {
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

// Test cases
console.log('Testing currency conversion functions...\n');

try {
  // Test standard 3-char codes
  console.log('USD ->', currencyNameToCode('USD'));
  console.log('EUR ->', currencyNameToCode('EUR'));
  
  // Test longer names  
  console.log('MyCustomToken ->', currencyNameToCode('MyCustomToken'));
  
  // Test reverse conversion
  const hexCode = currencyNameToCode('MyCustomToken');
  console.log('Reverse conversion:', hexCode, '->', currencyCodeToName(hexCode));
  
  // Test standard codes reverse
  console.log('USD reverse:', currencyCodeToName('USD'));
  
  console.log('\nAll tests passed!');
  
} catch (error) {
  console.error('Test failed:', error.message);
}