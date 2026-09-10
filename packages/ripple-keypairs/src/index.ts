import {
  decodeNodePublic,
  decodeSeed,
  encodeAccountID,
  encodeSeed,
} from 'ripple-address-codec'
import { ripemd160 } from '@xrplf/isomorphic/ripemd160'
import { sha256 } from '@xrplf/isomorphic/sha256'
import { hexToBytes, randomBytes } from '@xrplf/isomorphic/utils'

import { accountPublicFromPublicGenerator } from './signing-schemes/secp256k1/utils'
import Sha512 from './utils/Sha512'
import assert from './utils/assert'
import type { Algorithm, HexString, KeyPair, SigningScheme } from './types'
import {
  getAlgorithmFromPrivateKey,
  getAlgorithmFromPublicKey,
} from './utils/getAlgorithmFromKey'

import secp256k1 from './signing-schemes/secp256k1'
import ed25519 from './signing-schemes/ed25519'

const SEED_ENTROPY_LENGTH_BYTES = 16

/**
 * Checks whether a value is a Uint8Array, including subclasses such as Buffer
 * and instances from another realm, which fail a plain `instanceof` check.
 *
 * @param value - The value to test.
 * @returns Whether the value is a Uint8Array.
 */
function isUint8Array(value: unknown): value is Uint8Array {
  return (
    value instanceof Uint8Array ||
    // The tag check alone would also admit other single-byte views, so
    // require the element size too.
    (ArrayBuffer.isView(value) &&
      'BYTES_PER_ELEMENT' in value &&
      value.BYTES_PER_ELEMENT === 1 &&
      Object.prototype.toString.call(value) === '[object Uint8Array]')
  )
}

function getSigningScheme(algorithm: Algorithm): SigningScheme {
  const schemes = { 'ecdsa-secp256k1': secp256k1, ed25519 }
  return schemes[algorithm]
}

function generateSeed(
  options: {
    entropy?: Uint8Array
    algorithm?: Algorithm
  } = {},
): string {
  const VALID_ALGORITHMS: Algorithm[] = ['ecdsa-secp256k1', 'ed25519']
  assert.ok(
    !options.algorithm || VALID_ALGORITHMS.includes(options.algorithm),
    `Unsupported algorithm: ${options.algorithm}. Use one of: ${VALID_ALGORITHMS.join(', ')}`,
  )
  // Entropy must be refused, not resized. Truncating over-length entropy
  // silently discards the caller's extra bytes, and accepting a non-byte-array
  // lets a coerced value (a string, say) through as well-formed zero bytes.
  assert.ok(
    options.entropy == null || isUint8Array(options.entropy),
    'entropy must be a Uint8Array',
  )
  assert.ok(
    options.entropy == null ||
      options.entropy.length === SEED_ENTROPY_LENGTH_BYTES,
    `entropy must be exactly ${SEED_ENTROPY_LENGTH_BYTES} bytes`,
  )
  const entropy = options.entropy ?? randomBytes(SEED_ENTROPY_LENGTH_BYTES)
  const type = options.algorithm === 'ecdsa-secp256k1' ? 'secp256k1' : 'ed25519'
  return encodeSeed(entropy, type)
}

function deriveKeypair(
  seed: string,
  options?: {
    algorithm?: Algorithm
    validator?: boolean
    accountIndex?: number
  },
): KeyPair {
  const decoded = decodeSeed(seed)
  const proposedAlgorithm = options?.algorithm ?? decoded.type
  const algorithm =
    proposedAlgorithm === 'ed25519' ? 'ed25519' : 'ecdsa-secp256k1'
  const scheme = getSigningScheme(algorithm)
  const keypair = scheme.deriveKeypair(decoded.bytes, options)
  const messageToVerify = Sha512.half('This test message should verify.')
  const signature = scheme.sign(messageToVerify, keypair.privateKey)
  /* istanbul ignore if */
  if (!scheme.verify(messageToVerify, signature, keypair.publicKey)) {
    throw new Error('derived keypair did not generate verifiable signature')
  }
  return keypair
}

function sign(messageHex: HexString, privateKey: HexString): HexString {
  const algorithm = getAlgorithmFromPrivateKey(privateKey)
  return getSigningScheme(algorithm).sign(hexToBytes(messageHex), privateKey)
}

function verify(
  messageHex: HexString,
  signature: HexString,
  publicKey: HexString,
): boolean {
  const algorithm = getAlgorithmFromPublicKey(publicKey)
  return getSigningScheme(algorithm).verify(
    hexToBytes(messageHex),
    signature,
    publicKey,
  )
}

function computePublicKeyHash(publicKeyBytes: Uint8Array): Uint8Array {
  return ripemd160(sha256(publicKeyBytes))
}

function deriveAddressFromBytes(publicKeyBytes: Uint8Array): string {
  return encodeAccountID(computePublicKeyHash(publicKeyBytes))
}

function deriveAddress(publicKey: string): string {
  return deriveAddressFromBytes(hexToBytes(publicKey))
}

function deriveNodeAddress(publicKey: string): string {
  const generatorBytes = decodeNodePublic(publicKey)
  const accountPublicBytes = accountPublicFromPublicGenerator(generatorBytes)
  return deriveAddressFromBytes(accountPublicBytes)
}

export {
  generateSeed,
  deriveKeypair,
  sign,
  verify,
  deriveAddress,
  deriveNodeAddress,
  decodeSeed,
  type Algorithm,
}
