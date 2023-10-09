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
  assert.ok(
    !options.entropy || options.entropy.length >= 16,
    'entropy too short',
  )
  const entropy = options.entropy
    ? options.entropy.slice(0, 16)
    : randomBytes(16)
  const type = options.algorithm === 'ed25519' ? 'ed25519' : 'secp256k1'
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
}
