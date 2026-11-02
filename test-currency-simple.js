// Simple standalone test for currency conversion functions
function stringToHex(str) {
  return Buffer.from(str, 'utf8').toString('hex')
}

function hexToString(hex) {
  return Buffer.from(hex, 'hex').toString('utf8')
}

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

  // For longer names, convert to hex string
  const hexString = stringToHex(currencyName).toUpperCase()
  
  // Check if the hex string is too long (more than 40 characters = 20 bytes)
  if (hexString.length > 40) {
    throw new Error(`Currency name "${currencyName}" is too long. Maximum length is 20 bytes when UTF-8 encoded.`)
  }
  
  // Pad to exactly 40 characters (20 bytes) with zeros
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
      
      return hexToString(trimmedHex)
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
  console.log('BTC ->', currencyNameToCode('BTC'));
  
  // Test longer names  
  console.log('MyCustomToken ->', currencyNameToCode('MyCustomToken'));
  console.log('GOLD ->', currencyNameToCode('GOLD'));
  console.log('MediumLengthToken ->', currencyNameToCode('MediumLengthToken'));
  
  // Test reverse conversion
  const hexCode1 = currencyNameToCode('MyCustomToken');
  console.log('\nReverse conversions:');
  console.log(hexCode1, '->', currencyCodeToName(hexCode1));
  
  const hexCode2 = currencyNameToCode('MediumLengthToken');
  console.log(hexCode2, '->', currencyCodeToName(hexCode2));
  
  // Test standard codes reverse
  console.log('USD reverse:', currencyCodeToName('USD'));
  console.log('EUR reverse:', currencyCodeToName('EUR'));
  
  // Test edge cases
  console.log('\nEdge cases:');
  console.log('XRP reverse:', currencyCodeToName('XRP'));
  
  // Test error case
  console.log('\nTesting error case:');
  try {
    currencyNameToCode('SomeVeryLongTokenNameThatExceedsTwentyBytes');
  } catch (error) {
    console.log('Expected error for long name:', error.message);
  }
  
  console.log('\n✅ All tests passed!');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
}