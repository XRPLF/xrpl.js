/**
 * Codec class
 */

import { base58xrp, BytesCoder } from '@scure/base'
import { sha256 } from '@xrplf/isomorphic/sha256'

import { arrayEqual, concatArgs, ByteArray } from './utils'

class Codec {
  private readonly _sha256: (bytes: ByteArray) => Uint8Array
  private readonly _codec: BytesCoder

  public constructor(options: { sha256: (bytes: ByteArray) => Uint8Array }) {
    this._sha256 = options.sha256
    this._codec = base58xrp
  }

  /**
   * Encoder.
   *
   * @param bytes - Uint8Array of data to encode.
   * @param opts - Options object including the version bytes and the expected length of the data to encode.
   */
  public encode(
    bytes: ByteArray,
    opts: {
      versions: number[]
      expectedLength: number
    },
  ): string {
    const versions = opts.versions
    return this._encodeVersioned(bytes, versions, opts.expectedLength)
  }

  /**
   * Decoder.
   *
   * @param base58string - Base58Check-encoded string to decode.
   * @param opts - Options object including the version byte(s) and the expected length of the data after decoding.
   */
  /* eslint-disable max-lines-per-function --
   * TODO refactor */
  public decode(
    base58string: string,
    opts: {
      versions: Array<number | number[]>
      expectedLength?: number
      versionTypes?: ['ed25519', 'secp256k1']
    },
  ): {
    version: number[]
    bytes: Uint8Array
    type: 'ed25519' | 'secp256k1' | null
  } {
    const versions = opts.versions
    const types = opts.versionTypes

    const withoutSum = this.decodeChecked(base58string)

    if (versions.length > 1 && !opts.expectedLength) {
      throw new Error(
        'expectedLength is required because there are >= 2 possible versions',
      )
    }
    const versionLengthGuess =
      typeof versions[0] === 'number' ? 1 : versions[0].length
    const payloadLength =
      opts.expectedLength ?? withoutSum.length - versionLengthGuess
    const versionBytes = withoutSum.slice(0, -payloadLength)
    const payload = withoutSum.slice(-payloadLength)

    for (let i = 0; i < versions.length; i++) {
      /* eslint-disable @typescript-eslint/consistent-type-assertions --
       * TODO refactor */
      const version: number[] = Array.isArray(versions[i])
        ? (versions[i] as number[])
        : [versions[i] as number]
      if (arrayEqual(versionBytes, version)) {
        return {
          version,
          bytes: payload,
          type: types ? types[i] : null,
        }
      }
      /* eslint-enable @typescript-eslint/consistent-type-assertions */
    }

    throw new Error(
      'version_invalid: version bytes do not match any of the provided version(s)',
    )
  }

  public encodeChecked(bytes: ByteArray): string {
    const check = this._sha256(this._sha256(bytes)).slice(0, 4)
    return this._encodeRaw(Uint8Array.from(concatArgs(bytes, check)))
  }

  public decodeChecked(base58string: string): Uint8Array {
    const intArray = this._decodeRaw(base58string)
    if (intArray.byteLength < 5) {
      throw new Error('invalid_input_size: decoded data must have length >= 5')
    }
    if (!this._verifyCheckSum(intArray)) {
      throw new Error('checksum_invalid')
    }
    return intArray.slice(0, -4)
  }

  private _encodeVersioned(
    bytes: ByteArray,
    versions: number[],
    expectedLength: number,
  ): string {
    if (!checkByteLength(bytes, expectedLength)) {
      throw new Error(
        'unexpected_payload_length: bytes.length does not match expectedLength.' +
          ' Ensure that the bytes are a Uint8Array.',
      )
    }
    return this.encodeChecked(concatArgs(versions, bytes))
  }

  private _encodeRaw(bytes: ByteArray): string {
    return this._codec.encode(Uint8Array.from(bytes))
  }
  /* eslint-enable max-lines-per-function */

  private _decodeRaw(base58string: string): Uint8Array {
    return this._codec.decode(base58string)
  }

  private _verifyCheckSum(bytes: ByteArray): boolean {
    const computed = this._sha256(this._sha256(bytes.slice(0, -4))).slice(0, 4)
    const checksum = bytes.slice(-4)
    return arrayEqual(computed, checksum)
  }
}

/**
 * XRP codec
 */

// base58 encodings: https://xrpl.org/base58-encodings.html
// Account address (20 bytes)
const ACCOUNT_ID = 0
// Account public key (33 bytes)
const ACCOUNT_PUBLIC_KEY = 0x23
// 33; Seed value (for secret keys) (16 bytes)
const FAMILY_SEED = 0x21
// 28; Validation public key (33 bytes)
const NODE_PUBLIC = 0x1c

// [1, 225, 75]
const ED25519_SEED = [0x01, 0xe1, 0x4b]

const codecOptions = {
  sha256,
}

const codecWithXrpAlphabet = new Codec(codecOptions)

export const codec = codecWithXrpAlphabet

// entropy is a Uint8Array of size 16
// type is 'ed25519' or 'secp256k1'
export function encodeSeed(
  entropy: ByteArray,
  type: 'ed25519' | 'secp256k1',
): string {
  if (!checkByteLength(entropy, 16)) {
    throw new Error('entropy must have length 16')
  }
  const opts = {
    expectedLength: 16,

    // for secp256k1, use `FAMILY_SEED`
    versions: type === 'ed25519' ? ED25519_SEED : [FAMILY_SEED],
  }

  // prefixes entropy with version bytes
  return codecWithXrpAlphabet.encode(entropy, opts)
}

export function decodeSeed(
  seed: string,
  opts: {
    versionTypes: ['ed25519', 'secp256k1']
    versions: Array<number | number[]>
    expectedLength: number
  } = {
    versionTypes: ['ed25519', 'secp256k1'],
    versions: [ED25519_SEED, FAMILY_SEED],
    expectedLength: 16,
  },
): {
  version: number[]
  bytes: Uint8Array
  type: 'ed25519' | 'secp256k1' | null
} {
  return codecWithXrpAlphabet.decode(seed, opts)
}

export function encodeAccountID(bytes: ByteArray): string {
  const opts = { versions: [ACCOUNT_ID], expectedLength: 20 }
  return codecWithXrpAlphabet.encode(bytes, opts)
}

/* eslint-disable import/no-unused-modules ---
 * unclear why this is aliased but we should keep it in case someone else is
 * importing it with the aliased name */
export const encodeAddress = encodeAccountID
/* eslint-enable import/no-unused-modules */

export function decodeAccountID(accountId: string): Uint8Array {
  const opts = { versions: [ACCOUNT_ID], expectedLength: 20 }
  return codecWithXrpAlphabet.decode(accountId, opts).bytes
}

/* eslint-disable import/no-unused-modules ---
 * unclear why this is aliased but we should keep it in case someone else is
 * importing it with the aliased name */
export const decodeAddress = decodeAccountID
/* eslint-enable import/no-unused-modules */

export function decodeNodePublic(base58string: string): Uint8Array {
  const opts = { versions: [NODE_PUBLIC], expectedLength: 33 }
  return codecWithXrpAlphabet.decode(base58string, opts).bytes
}

export function encodeNodePublic(bytes: ByteArray): string {
  const opts = { versions: [NODE_PUBLIC], expectedLength: 33 }
  return codecWithXrpAlphabet.encode(bytes, opts)
}

export function encodeAccountPublic(bytes: ByteArray): string {
  const opts = { versions: [ACCOUNT_PUBLIC_KEY], expectedLength: 33 }
  return codecWithXrpAlphabet.encode(bytes, opts)
}

export function decodeAccountPublic(base58string: string): Uint8Array {
  const opts = { versions: [ACCOUNT_PUBLIC_KEY], expectedLength: 33 }
  return codecWithXrpAlphabet.decode(base58string, opts).bytes
}

export function isValidClassicAddress(address: string): boolean {
  try {
    decodeAccountID(address)
  } catch (_error) {
    return false
  }
  return true
}

function checkByteLength(bytes: ByteArray, expectedLength: number): boolean {
  return 'byteLength' in bytes
    ? bytes.byteLength === expectedLength
    : bytes.length === expectedLength
}
