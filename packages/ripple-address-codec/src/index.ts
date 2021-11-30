import * as assert from 'assert'

import {
  codec,
  encodeSeed,
  decodeSeed,
  encodeAccountID,
  decodeAccountID,
  encodeNodePublic,
  decodeNodePublic,
  encodeAccountPublic,
  decodeAccountPublic,
  isValidClassicAddress,
} from './xrp-codec'

const PREFIX_BYTES = {
  // 5, 68
  MAIN: Buffer.from([0x05, 0x44]),
  // 4, 147
  TEST: Buffer.from([0x04, 0x93]),
}

const MAX_32_BIT_UNSIGNED_INT = 4294967295

function classicAddressToXAddress(
  classicAddress: string,
  tag: number | false,
  test: boolean,
): string {
  const accountId = decodeAccountID(classicAddress)
  return encodeXAddress(accountId, tag, test)
}

function encodeXAddress(
  accountId: Buffer,
  tag: number | false,
  test: boolean,
): string {
  if (accountId.length !== 20) {
    // RIPEMD160 is 160 bits = 20 bytes
    throw new Error('Account ID must be 20 bytes')
  }
  if (tag > MAX_32_BIT_UNSIGNED_INT) {
    throw new Error('Invalid tag')
  }
  const theTag = tag === false ? 0 : tag
  const flag = tag === false ? 0 : 1
  /* eslint-disable no-bitwise ---
   * need to use bitwise operations here */
  const bytes = Buffer.concat([
    test ? PREFIX_BYTES.TEST : PREFIX_BYTES.MAIN,
    accountId,
    Buffer.from([
      // 0x00 if no tag, 0x01 if 32-bit tag
      flag,
      // first byte
      theTag & 0xff,
      // second byte
      (theTag >> 8) & 0xff,
      // third byte
      (theTag >> 16) & 0xff,
      // fourth byte
      (theTag >> 24) & 0xff,
      0,
      0,
      0,
      // four zero bytes (reserved for 64-bit tags)
      0,
    ]),
  ])
  /* eslint-enable no-bitwise */
  return codec.encodeChecked(bytes)
}

function xAddressToClassicAddress(xAddress: string): {
  classicAddress: string
  tag: number | false
  test: boolean
} {
  const { accountId, tag, test } = decodeXAddress(xAddress)
  const classicAddress = encodeAccountID(accountId)
  return {
    classicAddress,
    tag,
    test,
  }
}

function decodeXAddress(xAddress: string): {
  accountId: Buffer
  tag: number | false
  test: boolean
} {
  const decoded = codec.decodeChecked(xAddress)
  const test = isBufferForTestAddress(decoded)
  const accountId = decoded.slice(2, 22)
  const tag = tagFromBuffer(decoded)
  return {
    accountId,
    tag,
    test,
  }
}

function isBufferForTestAddress(buf: Buffer): boolean {
  const decodedPrefix = buf.slice(0, 2)
  if (PREFIX_BYTES.MAIN.equals(decodedPrefix)) {
    return false
  }
  if (PREFIX_BYTES.TEST.equals(decodedPrefix)) {
    return true
  }
  throw new Error('Invalid X-address: bad prefix')
}

function tagFromBuffer(buf: Buffer): number | false {
  const flag = buf[22]
  if (flag >= 2) {
    // No support for 64-bit tags at this time
    throw new Error('Unsupported X-address')
  }
  if (flag === 1) {
    // Little-endian to big-endian
    return buf[23] + buf[24] * 0x100 + buf[25] * 0x10000 + buf[26] * 0x1000000
  }
  assert.strictEqual(flag, 0, 'flag must be zero to indicate no tag')
  assert.ok(
    Buffer.from('0000000000000000', 'hex').equals(buf.slice(23, 23 + 8)),
    'remaining bytes must be zero',
  )
  return false
}

function isValidXAddress(xAddress: string): boolean {
  try {
    decodeXAddress(xAddress)
  } catch (_error) {
    return false
  }
  return true
}

export {
  // Codec with XRP alphabet
  codec,
  // Encode entropy as a "seed"
  encodeSeed,
  // Decode a seed into an object with its version, type, and bytes
  decodeSeed,
  // Encode bytes as a classic address (r...)
  encodeAccountID,
  // Decode a classic address to its raw bytes
  decodeAccountID,
  // Encode bytes to XRP Ledger node public key format
  encodeNodePublic,
  // Decode an XRP Ledger node public key into its raw bytes
  decodeNodePublic,
  // Encode a public key, as for payment channels
  encodeAccountPublic,
  // Decode a public key, as for payment channels
  decodeAccountPublic,
  // Check whether a classic address (r...) is valid
  isValidClassicAddress,
  // Derive X-address from classic address, tag, and network ID
  classicAddressToXAddress,
  // Encode account ID, tag, and network ID to X-address
  encodeXAddress,
  // Decode X-address to account ID, tag, and network ID
  xAddressToClassicAddress,
  // Convert X-address to classic address, tag, and network ID
  decodeXAddress,
  // Check whether an X-address (X...) is valid
  isValidXAddress,
}
