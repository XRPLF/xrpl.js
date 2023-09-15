import * as addressCodec from 'ripple-address-codec'

import { secp256k1 as nobleSecp256k1 } from '@noble/curves/secp256k1'
import { ed25519 as nobleEd25519 } from '@noble/curves/ed25519'
import { numberToBytesBE } from '@noble/curves/abstract/utils'
import { ripemd160 } from '@xrplf/isomorphic/ripemd160'
import { sha256 } from '@xrplf/isomorphic/sha256'
import { bytesToHex, hexToBytes, randomBytes } from '@xrplf/isomorphic/utils'

import { accountPublicFromPublicGenerator, derivePrivateKey } from './secp256k1'
import Sha512 from './Sha512'
import assert from './assert'

export type ByteArray = number[] | Uint8Array
export type HexString = string
type Input = string | Uint8Array

const SECP256K1_PREFIX = '00'

function hash(message: Input | number[]): Uint8Array {
  return new Sha512().add(message).first256()
}

function generateSeed(
  options: {
    entropy?: Uint8Array
    algorithm?: 'ed25519' | 'ecdsa-secp256k1'
  } = {},
): string {
  assert.ok(
    !options.entropy || options.entropy.length >= 16,
    'entropy too short',
  )
  const entropy = options.entropy
    ? options.entropy.slice(0, 16)
    : randomBytes(16)
  const type = options.algorithm === 'ed25519' ? 'ed25519' : 'secp256k1'
  return addressCodec.encodeSeed(entropy, type)
}

const secp256k1 = {
  deriveKeypair(
    entropy: Uint8Array,
    options?: object,
  ): {
    privateKey: string
    publicKey: string
  } {
    const derived = derivePrivateKey(entropy, options)
    const privateKey =
      SECP256K1_PREFIX + bytesToHex(numberToBytesBE(derived, 32))

    const publicKey = bytesToHex(nobleSecp256k1.getPublicKey(derived, true))
    return { privateKey, publicKey }
  },

  sign(message: ByteArray, privateKey: HexString): string {
    // Some callers pass the privateKey with the prefix, others without.
    // elliptic.js implementation ignored the prefix, interpreting it as a
    // leading zero byte. @noble/curves will throw if the key is not exactly
    // 32 bytes, so we normalize it before passing to the sign method.
    // TODO: keep back compat like this, or simply always require prefix as
    // the ed25519 sign method does.
    assert.ok(
      (privateKey.length === 66 && privateKey.startsWith(SECP256K1_PREFIX)) ||
        privateKey.length === 64,
    )
    const normed = privateKey.length === 66 ? privateKey.slice(2) : privateKey
    return nobleSecp256k1
      .sign(hash(message), normed)
      .toDERHex(true)
      .toUpperCase()
  },

  verify(message, signature, publicKey): boolean {
    const decoded = nobleSecp256k1.Signature.fromDER(signature)
    return nobleSecp256k1.verify(decoded, hash(message), publicKey)
  },
}

const ed25519 = {
  deriveKeypair(entropy: ByteArray): {
    privateKey: string
    publicKey: string
  } {
    const prefix = 'ED'
    const rawPrivateKey = hash(entropy)
    const privateKey = prefix + bytesToHex(rawPrivateKey)
    const publicKey =
      prefix + bytesToHex(nobleEd25519.getPublicKey(rawPrivateKey))
    return { privateKey, publicKey }
  },

  sign(message: ByteArray, privateKey: HexString): string {
    assert.ok(
      Array.isArray(message) || message instanceof Uint8Array,
      'message must be array of octets',
    )
    assert.ok(
      privateKey.length === 66,
      'private key must be 33 bytes including prefix',
    )
    return bytesToHex(
      nobleEd25519.sign(new Uint8Array(message), privateKey.slice(2)),
    )
  },

  verify(
    message: ByteArray,
    signature: HexString | Uint8Array,
    publicKey: string,
  ): boolean {
    return nobleEd25519.verify(
      signature,
      new Uint8Array(message),
      publicKey.slice(2),
    )
  },
}

function select(algorithm: 'ecdsa-secp256k1' | 'ed25519') {
  const methods = { 'ecdsa-secp256k1': secp256k1, ed25519 }
  return methods[algorithm]
}

function deriveKeypair(
  seed: string,
  options?: {
    algorithm?: 'ed25519' | 'ecdsa-secp256k1'
    validator?: boolean
    accountIndex?: number
  },
): {
  publicKey: string
  privateKey: string
} {
  const decoded = addressCodec.decodeSeed(seed)
  const proposedAlgorithm = options?.algorithm ?? decoded.type
  const algorithm =
    proposedAlgorithm === 'ed25519' ? 'ed25519' : 'ecdsa-secp256k1'
  const method = select(algorithm)
  const keypair = method.deriveKeypair(decoded.bytes, options)
  const messageToVerify = hash('This test message should verify.')
  const signature = method.sign(messageToVerify, keypair.privateKey)
  /* istanbul ignore if */
  if (!method.verify(messageToVerify, signature, keypair.publicKey)) {
    throw new Error('derived keypair did not generate verifiable signature')
  }
  return keypair
}

/**
 * Determines the algorithm associated with a given key (public/private).
 *
 * | Curve     | Type        | Prefix | Length | Description                                           | Algorithm       |
 * |-----------|-------------|:------:|:------:|-------------------------------------------------------|----------------:|
 * | ed25519   | Private     |  0xED  |   33   | prefix + Uint256LE (0 < n < order )                   |         ed25519 |
 * | ed25519   | Public      |  0xED  |   33   | prefix + 32 y-bytes                                   |         ed25519 |
 * | secp256k1 | Public (1)  |  0x02  |   33   | prefix + 32 x-bytes                                   | ecdsa-secp256k1 |
 * | secp256k1 | Public (2)  |  0x03  |   33   | prefix + 32 x-bytes (y is odd)                        | ecdsa-secp256k1 |
 * | secp256k1 | Public (3)  |  0x04  |   65   | prefix + 32 x-bytes + 32 y-bytes                      | ecdsa-secp256k1 |
 * | secp256k1 | Private (1) |  None  |   32   | Uint256BE (0 < n < order)                             | ecdsa-secp256k1 |
 * | secp256k1 | Private (2) |  0x00  |   33   | prefix + Uint256BE (0 < n < order)                    | ecdsa-secp256k1 |
 *
 * Note: The 0x00 prefix for secpk256k1 Private (2) essentially 0 pads the number
 *       and the interpreted number is the same as 32 bytes.
 *
 * @param key - hexadecimal string representation of the key.
 * @returns {'ed25519' | 'ecdsa-secp256k1'} algorithm for signing/verifying
 * @throws Error when key is invalid
 */
function getAlgorithmFromKey(key: HexString): 'ed25519' | 'ecdsa-secp256k1' {
  const bytes = hexToBytes(key)
  const tag = bytes[0]
  const len = bytes.length

  if (len === 32) {
    return 'ecdsa-secp256k1'
  }
  if (len === 33 && tag === 0xed) {
    return 'ed25519'
  }
  if (len === 33 && (tag === 0x00 || tag === 0x02 || tag === 0x03)) {
    return 'ecdsa-secp256k1'
  }
  if (len === 65 && tag === 0x04) {
    return 'ecdsa-secp256k1'
  }
  throw new Error('invalid key format')
}

function sign(messageHex: HexString, privateKey: HexString): string {
  const algorithm = getAlgorithmFromKey(privateKey)
  return select(algorithm).sign(hexToBytes(messageHex), privateKey)
}

function verify(
  messageHex: HexString,
  signature: HexString,
  publicKey: HexString,
): boolean {
  const algorithm = getAlgorithmFromKey(publicKey)
  return select(algorithm).verify(hexToBytes(messageHex), signature, publicKey)
}

function computePublicKeyHash(publicKeyBytes: Uint8Array): Uint8Array {
  return ripemd160(sha256(publicKeyBytes))
}

function deriveAddressFromBytes(publicKeyBytes: Uint8Array): string {
  return addressCodec.encodeAccountID(computePublicKeyHash(publicKeyBytes))
}

function deriveAddress(publicKey: string): string {
  return deriveAddressFromBytes(hexToBytes(publicKey))
}

function deriveNodeAddress(publicKey: string): string {
  const generatorBytes = addressCodec.decodeNodePublic(publicKey)
  const accountPublicBytes = accountPublicFromPublicGenerator(generatorBytes)
  return deriveAddressFromBytes(accountPublicBytes)
}

const { decodeSeed } = addressCodec

export {
  generateSeed,
  deriveKeypair,
  sign,
  verify,
  deriveAddress,
  deriveNodeAddress,
  decodeSeed,
}
