/**
 * Codec class
 */

const baseCodec = require('base-x')
const {seqEqual, concatArgs} = require('.//utils')

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
  }) {
    const versions = opts.versions
    return this.encodeVersioned(bytes, versions, opts.expectedLength)
  }

  encodeVersioned(bytes: Buffer, versions: number[], expectedLength: number) {
    if (expectedLength && bytes.length !== expectedLength) {
      throw new Error('unexpected_payload_length: bytes.length does not match expectedLength')
    }
    return this.encodeChecked(concatArgs(versions, bytes))
  }

  encodeChecked(buffer: Buffer) {
    const check = this.sha256(this.sha256(buffer)).slice(0, 4)
    return this.encodeRaw(concatArgs(buffer, check))
  }

  encodeRaw(bytes: Buffer) {
    return this.codec.encode(bytes)
  }

  /**
   * Decoder.
   *
   * @param base58string Base58Check-encoded string to decode.
   * @param opts Options object including the version byte(s) and the expected length of the data after decoding.
   */
  decode(base58string: string, opts: {
    versions?: (number | number[])[],
    expectedLength?: number,
    versionTypes?: ['ed25519', 'secp256k1']
  } = {}) {
    const versions = Array.isArray(opts.versions) ? opts.versions : [opts.versions]
    const types = opts.versionTypes
    if (versions) {
      const withoutSum = this.decodeChecked(base58string)
      const ret: {
        version: number[] | null,
        bytes: Buffer | null,
        type: string | null // for seeds, 'ed25519' | 'secp256k1'
      } = {
        version: null,
        bytes: null,
        type: null
      }
      if (versions.length > 1 && !opts.expectedLength) {
        throw new Error('expectedLength is required because there are >= 2 possible versions')
      }
      const versionLengthGuess = typeof versions[0] === 'number' ? 1 : (versions[0] as number[]).length
      const payloadLength = opts.expectedLength || withoutSum.length - versionLengthGuess
      const versionBytes = withoutSum.slice(0, -payloadLength)
      const payload = withoutSum.slice(-payloadLength)

      let foundVersion = false
      for (let i = 0; i < versions.length; i++) {
        const version: number[] = Array.isArray(versions[i]) ? versions[i] as number[] : [versions[i] as number]
        if (seqEqual(versionBytes, version)) {
          ret.version = version
          ret.bytes = payload
          if (types) {
            ret.type = types[i]
          }
          foundVersion = true
        }
      }

      if (!foundVersion) {
        throw new Error('version_invalid: version bytes do not match any of the provided version(s)')
      }

      if (opts.expectedLength && ret.bytes.length !== opts.expectedLength) {
        throw new Error('unexpected_payload_length: payload length does not match expectedLength')
      }

      return ret
    }

    // Assume that base58string is 'checked'
    return this.decodeChecked(base58string)
  }

  decodeChecked(base58string: string) {
    const buffer = this.decodeRaw(base58string)
    if (buffer.length < 5) {
      throw new Error('invalid_input_size: decoded data must have length >= 5')
    }
    if (!this.verifyCheckSum(buffer)) {
      throw new Error('checksum_invalid')
    }
    return buffer.slice(0, -4)
  }

  decodeRaw(base58string: string) {
    return this.codec.decode(base58string)
  }

  verifyCheckSum(bytes: Buffer) {
    const computed = this.sha256(this.sha256(bytes.slice(0, -4))).slice(0, 4)
    const checksum = bytes.slice(-4)
    return seqEqual(computed, checksum)
  }
}

/**
 * XRP codec
 */

const createHash = require('create-hash')

const NODE_PUBLIC = 28
const ACCOUNT_ID = 0
const FAMILY_SEED = 0x21 // 33
const ED25519_SEED = [0x01, 0xE1, 0x4B] // [1, 225, 75]

const codecOptions = {
  sha256: function(bytes: Uint8Array) {
    return createHash('sha256').update(Buffer.from(bytes)).digest()
  },
  alphabet: 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz'
}

const codecWithXrpAlphabet = new Codec(codecOptions)

// entropy is a Buffer of size 16
// type is 'ed25519' or 'secp256k1'
export function encodeSeed(entropy: Buffer, type: 'ed25519' | 'secp256k1'): string {
  if (entropy.length !== 16) {
    throw new Error('entropy must have length 16')
  }
  if (type !== 'ed25519' && type !== 'secp256k1') {
    throw new Error('type must be ed25519 or secp256k1')
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
  versionTypes?: ['ed25519', 'secp256k1'],
  versions?: (number | number[])[]
  expectedLength?: number
} = {}) {
  if (!opts.versionTypes || !opts.versions) {
    opts.versionTypes = ['ed25519', 'secp256k1']
    opts.versions = [ED25519_SEED, FAMILY_SEED]
  }
  if (!opts.expectedLength) {
    opts.expectedLength = 16
  }
  return codecWithXrpAlphabet.decode(seed, opts)
}

export function encodeAccountID(bytes: Buffer): string {
  const opts = {versions: [ACCOUNT_ID], expectedLength: 20}
  return codecWithXrpAlphabet.encode(bytes, opts)
}

export function decodeAccountID(accountId: string): Buffer {
  const opts = {versions: [ACCOUNT_ID], expectedLength: 20}
  return codecWithXrpAlphabet.decode(accountId, opts).bytes
}

export function decodeNodePublic(base58string: string): Buffer {
  const opts = {versions: [NODE_PUBLIC], expectedLength: 33}
  return codecWithXrpAlphabet.decode(base58string, opts).bytes
}

export function encodeNodePublic(bytes: Buffer): string {
  const opts = {versions: [NODE_PUBLIC], expectedLength: 33}
  return codecWithXrpAlphabet.encode(bytes, opts)
}

// Address === AccountID
export function isValidAddress(address: string): boolean {
  try {
    this.decodeAccountID(address)
  } catch (e) {
    return false
  }
  return true
}
