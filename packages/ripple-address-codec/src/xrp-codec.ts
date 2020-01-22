/**
 * Codec class
 */

import * as baseCodec from 'base-x'
import {seqEqual, concatArgs} from './utils'

class Codec {
  sha256: (bytes: Uint8Array) => Buffer
  alphabet: string
  codec: any
  base: number

  constructor(options: {
    sha256: (bytes: Uint8Array) => Buffer,
    alphabet: string
  }) {
    this.sha256 = options.sha256
    this.alphabet = options.alphabet
    this.codec = baseCodec(this.alphabet)
    this.base = this.alphabet.length
  }

  /**
   * Encoder.
   *
   * @param bytes Buffer of data to encode.
   * @param opts Options object including the version bytes and the expected length of the data to encode.
   */
  encode(bytes: Buffer, opts: {
    versions: number[],
    expectedLength: number
  }): string {
    const versions = opts.versions
    return this.encodeVersioned(bytes, versions, opts.expectedLength)
  }

  encodeVersioned(bytes: Buffer, versions: number[], expectedLength: number): string {
    if (expectedLength && bytes.length !== expectedLength) {
      throw new Error('unexpected_payload_length: bytes.length does not match expectedLength.' +
        ' Ensure that the bytes are a Buffer.')
    }
    return this.encodeChecked(Buffer.from(concatArgs(versions, bytes)))
  }

  encodeChecked(buffer: Buffer): string {
    const check = this.sha256(this.sha256(buffer)).slice(0, 4)
    return this.encodeRaw(Buffer.from(concatArgs(buffer, check)))
  }

  encodeRaw(bytes: Buffer): string {
    return this.codec.encode(bytes)
  }

  /**
   * Decoder.
   *
   * @param base58string Base58Check-encoded string to decode.
   * @param opts Options object including the version byte(s) and the expected length of the data after decoding.
   */
  decode(base58string: string, opts: {
    versions: (number | number[])[],
    expectedLength?: number,
    versionTypes?: ['ed25519', 'secp256k1']
  }): {
    version: number[],
    bytes: Buffer,
    type: string | null
  } {
    const versions = opts.versions
    const types = opts.versionTypes

    const withoutSum = this.decodeChecked(base58string)

    if (versions.length > 1 && !opts.expectedLength) {
      throw new Error('expectedLength is required because there are >= 2 possible versions')
    }
    const versionLengthGuess = typeof versions[0] === 'number' ? 1 : (versions[0] as number[]).length
    const payloadLength = opts.expectedLength || withoutSum.length - versionLengthGuess
    const versionBytes = withoutSum.slice(0, -payloadLength)
    const payload = withoutSum.slice(-payloadLength)

    for (let i = 0; i < versions.length; i++) {
      const version: number[] = Array.isArray(versions[i]) ? versions[i] as number[] : [versions[i] as number]
      if (seqEqual(versionBytes, version)) {
        return {
          version,
          bytes: payload,
          type: types ? types[i] : null
        }
      }
    }

    throw new Error('version_invalid: version bytes do not match any of the provided version(s)')
  }

  decodeChecked(base58string: string): Buffer {
    const buffer = this.decodeRaw(base58string)
    if (buffer.length < 5) {
      throw new Error('invalid_input_size: decoded data must have length >= 5')
    }
    if (!this.verifyCheckSum(buffer)) {
      throw new Error('checksum_invalid')
    }
    return buffer.slice(0, -4)
  }

  decodeRaw(base58string: string): Buffer {
    return this.codec.decode(base58string)
  }

  verifyCheckSum(bytes: Buffer): boolean {
    const computed = this.sha256(this.sha256(bytes.slice(0, -4))).slice(0, 4)
    const checksum = bytes.slice(-4)
    return seqEqual(computed, checksum)
  }
}

/**
 * XRP codec
 */

// Pure JavaScript hash functions in the browser, native hash functions in Node.js
const createHash = require('create-hash')

// base58 encodings: https://xrpl.org/base58-encodings.html
const ACCOUNT_ID = 0 // Account address (20 bytes)
const ACCOUNT_PUBLIC_KEY = 0x23 // Account public key (33 bytes)
const FAMILY_SEED = 0x21 // 33; Seed value (for secret keys) (16 bytes)
const NODE_PUBLIC = 0x1C // 28; Validation public key (33 bytes)

const ED25519_SEED = [0x01, 0xE1, 0x4B] // [1, 225, 75]

const codecOptions = {
  sha256: function(bytes: Uint8Array) {
    return createHash('sha256').update(Buffer.from(bytes)).digest()
  },
  alphabet: 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz'
}

const codecWithXrpAlphabet = new Codec(codecOptions)

export const codec = codecWithXrpAlphabet

// entropy is a Buffer of size 16
// type is 'ed25519' or 'secp256k1'
export function encodeSeed(entropy: Buffer, type: 'ed25519' | 'secp256k1'): string {
  if (entropy.length !== 16) {
    throw new Error('entropy must have length 16')
  }
  const opts = {
    expectedLength: 16,

    // for secp256k1, use `FAMILY_SEED`
    versions: type === 'ed25519' ? ED25519_SEED : [FAMILY_SEED]
  }

  // prefixes entropy with version bytes
  return codecWithXrpAlphabet.encode(entropy, opts)
}

export function decodeSeed(seed: string, opts: {
  versionTypes: ['ed25519', 'secp256k1'],
  versions: (number | number[])[]
  expectedLength: number
} = {
  versionTypes: ['ed25519', 'secp256k1'],
  versions: [ED25519_SEED, FAMILY_SEED],
  expectedLength: 16
}) {
  return codecWithXrpAlphabet.decode(seed, opts)
}

export function encodeAccountID(bytes: Buffer): string {
  const opts = {versions: [ACCOUNT_ID], expectedLength: 20}
  return codecWithXrpAlphabet.encode(bytes, opts)
}

export const encodeAddress = encodeAccountID

export function decodeAccountID(accountId: string): Buffer {
  const opts = {versions: [ACCOUNT_ID], expectedLength: 20}
  return codecWithXrpAlphabet.decode(accountId, opts).bytes
}

export const decodeAddress = decodeAccountID

export function decodeNodePublic(base58string: string): Buffer {
  const opts = {versions: [NODE_PUBLIC], expectedLength: 33}
  return codecWithXrpAlphabet.decode(base58string, opts).bytes
}

export function encodeNodePublic(bytes: Buffer): string {
  const opts = {versions: [NODE_PUBLIC], expectedLength: 33}
  return codecWithXrpAlphabet.encode(bytes, opts)
}

export function encodeAccountPublic(bytes: Buffer): string {
  const opts = {versions: [ACCOUNT_PUBLIC_KEY], expectedLength: 33}
  return codecWithXrpAlphabet.encode(bytes, opts)
}

export function decodeAccountPublic(base58string: string): Buffer {
  const opts = {versions: [ACCOUNT_PUBLIC_KEY], expectedLength: 33}
  return codecWithXrpAlphabet.decode(base58string, opts).bytes
}

export function isValidClassicAddress(address: string): boolean {
  try {
    decodeAccountID(address)
  } catch (e) {
    return false
  }
  return true
}
