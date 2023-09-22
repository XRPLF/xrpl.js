import * as addressCodec from 'ripple-address-codec'
import { ripemd160 } from '@xrplf/isomorphic/ripemd160'
import { sha256 } from '@xrplf/isomorphic/sha256'
import { hexToBytes, randomBytes } from '@xrplf/isomorphic/utils'

import { accountPublicFromPublicGenerator } from './signing-methods/secp256k1/utils'
import Sha512 from './utils/Sha512'
import assert from './utils/assert'
import { Algorithm, HexString, KeyPair, SigningMethod } from './types'
import {
  getAlgorithmFromPrivateKey,
  getAlgorithmFromPublicKey,
} from './utils/getAlgorithmFromKey'

import secp256k1 from './signing-methods/secp256k1'
import ed25519 from './signing-methods/ed25519'

function getSigningMethod(algorithm: Algorithm): SigningMethod {
  const methods = { 'ecdsa-secp256k1': secp256k1, ed25519 }
  return methods[algorithm]
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
  return addressCodec.encodeSeed(entropy, type)
}

function deriveKeypair(
  seed: string,
  options?: {
    algorithm?: Algorithm
    validator?: boolean
    accountIndex?: number
  },
): KeyPair {
  const decoded = addressCodec.decodeSeed(seed)
  const proposedAlgorithm = options?.algorithm ?? decoded.type
  const algorithm =
    proposedAlgorithm === 'ed25519' ? 'ed25519' : 'ecdsa-secp256k1'
  const method = getSigningMethod(algorithm)
  const keypair = method.deriveKeypair(decoded.bytes, options)
  const messageToVerify = Sha512.half('This test message should verify.')
  const signature = method.sign(messageToVerify, keypair.privateKey)
  /* istanbul ignore if */
  if (!method.verify(messageToVerify, signature, keypair.publicKey)) {
    throw new Error('derived keypair did not generate verifiable signature')
  }
  return keypair
}

function sign(messageHex: HexString, privateKey: HexString): HexString {
  const algorithm = getAlgorithmFromPrivateKey(privateKey)
  return getSigningMethod(algorithm).sign(hexToBytes(messageHex), privateKey)
}

function verify(
  messageHex: HexString,
  signature: HexString,
  publicKey: HexString,
): boolean {
  const algorithm = getAlgorithmFromPublicKey(publicKey)
  return getSigningMethod(algorithm).verify(
    hexToBytes(messageHex),
    signature,
    publicKey,
  )
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
