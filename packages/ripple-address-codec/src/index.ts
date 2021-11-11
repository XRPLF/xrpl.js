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
  isValidClassicAddress
} from './xrp-codec'
import * as assert from 'assert'

const PREFIX_BYTES = {
  MAIN: Buffer.from([0x05, 0x44]), // 5, 68
  TEST: Buffer.from([0x04, 0x93]) // 4, 147
}

function classicAddressToXAddress(classicAddress: string, tag: number | false, test: boolean): string {
  const accountId = decodeAccountID(classicAddress)
  return encodeXAddress(accountId, tag, test)
}

function encodeXAddress(accountId: Buffer, tag: number | false, test: boolean): string {
  if (accountId.length !== 20) {
    // RIPEMD160 is 160 bits = 20 bytes
    throw new Error('Account ID must be 20 bytes')
  }
  const MAX_32_BIT_UNSIGNED_INT = 4294967295
  const flag = tag === false ? 0 : tag <= MAX_32_BIT_UNSIGNED_INT ? 1 : 2
  if (flag === 2) {
    throw new Error('Invalid tag')
  }
  if (tag === false) {
    tag = 0
  }
  const bytes = Buffer.concat(
    [
      test ? PREFIX_BYTES.TEST : PREFIX_BYTES.MAIN,
      accountId,
      Buffer.from(
        [
          flag, // 0x00 if no tag, 0x01 if 32-bit tag
          tag & 0xff, // first byte
          (tag >> 8) & 0xff, // second byte
          (tag >> 16) & 0xff, // third byte
          (tag >> 24) & 0xff, // fourth byte
          0, 0, 0, 0 // four zero bytes (reserved for 64-bit tags)
        ]
      )
    ]
  )
  const xAddress = codec.encodeChecked(bytes)
  return xAddress
}

function xAddressToClassicAddress(xAddress: string): {classicAddress: string, tag: number | false, test: boolean} {
  const {
    accountId,
    tag,
    test
  } = decodeXAddress(xAddress)
  const classicAddress = encodeAccountID(accountId)
  return {
    classicAddress,
    tag,
    test
  }
}

function decodeXAddress(xAddress: string): {accountId: Buffer, tag: number | false, test: boolean} {
  const decoded = codec.decodeChecked(xAddress)
  const test = isBufferForTestAddress(decoded)
  const accountId = decoded.slice(2, 22)
  const tag = tagFromBuffer(decoded)
  return {
    accountId,
    tag,
    test
  }
}

function isBufferForTestAddress(buf: Buffer): boolean {
  const decodedPrefix = buf.slice(0, 2)
  if (PREFIX_BYTES.MAIN.equals(decodedPrefix)) {
    return false
  } else if (PREFIX_BYTES.TEST.equals(decodedPrefix)) {
    return true
  } else {
    throw new Error('Invalid X-address: bad prefix')
  }
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
  assert.ok(Buffer.from('0000000000000000', 'hex').equals(buf.slice(23, 23 + 8)),
    'remaining bytes must be zero')
  return false
}

function isValidXAddress(xAddress: string): boolean {
  try {
    decodeXAddress(xAddress)
  } catch (e) {
    return false
  }
  return true
}

export {
  codec, // Codec with XRP alphabet
  encodeSeed, // Encode entropy as a "seed"
  decodeSeed, // Decode a seed into an object with its version, type, and bytes
  encodeAccountID, // Encode bytes as a classic address (r...)
  decodeAccountID, // Decode a classic address to its raw bytes
  encodeNodePublic, // Encode bytes to XRP Ledger node public key format
  decodeNodePublic, // Decode an XRP Ledger node public key into its raw bytes
  encodeAccountPublic, // Encode a public key, as for payment channels
  decodeAccountPublic, // Decode a public key, as for payment channels
  isValidClassicAddress, // Check whether a classic address (r...) is valid
  classicAddressToXAddress, // Derive X-address from classic address, tag, and network ID
  encodeXAddress, // Encode account ID, tag, and network ID to X-address
  xAddressToClassicAddress, // Decode X-address to account ID, tag, and network ID
  decodeXAddress, // Convert X-address to classic address, tag, and network ID
  isValidXAddress // Check whether an X-address (X...) is valid
}
