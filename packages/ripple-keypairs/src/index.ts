import * as assert from 'assert'
import Sha512 from './Sha512'

import * as nobleSecp256k1 from '@noble/curves/secp256k1'
import * as nobleEd25519 from '@noble/curves/ed25519'
import * as nobleUtils from '@noble/curves/abstract/utils'
import * as nobleHashesUtils from '@noble/hashes/utils'

import * as addressCodec from 'ripple-address-codec'
import { accountPublicFromPublicGenerator, derivePrivateKey } from './secp256k1'
import * as utils from './utils'

const { hexToBytes } = utils
const { bytesToHex } = utils

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
    : nobleHashesUtils.randomBytes(16)
  const type = options.algorithm === 'ed25519' ? 'ed25519' : 'secp256k1'
  return addressCodec.encodeSeed(Buffer.from(entropy), type)
}

function hash(message): Uint8Array {
  return new Sha512().add(message).first256()
}

const secp256k1 = {
  deriveKeypair(
    entropy: Uint8Array,
    options?: object,
  ): {
    privateKey: string
    publicKey: string
  } {
    const prefix = '00'

    const derived = derivePrivateKey(entropy, options)
    const privateKey =
      prefix + bytesToHex(nobleUtils.numberToBytesBE(derived, 32))

    const publicKey = bytesToHex(
      nobleSecp256k1.secp256k1.getPublicKey(privateKey.slice(2), true),
    )
    return { privateKey, publicKey }
  },

  sign(message, privateKey: string): string {
    // TODO: some callers pass in 32 bytes, others 33 bytes (including the 0
    // prefix )
    const normed = privateKey.length === 66 ? privateKey.slice(2) : privateKey
    return nobleSecp256k1.secp256k1
      .sign(hash(message), normed)
      .toDERHex(true)
      .toUpperCase()
  },

  verify(message, signature, publicKey): boolean {
    const decoded = nobleSecp256k1.secp256k1.Signature.fromDER(signature)
    return nobleSecp256k1.secp256k1.verify(decoded, hash(message), publicKey)
  },
}

const ed25519 = {
  deriveKeypair(entropy: Uint8Array): {
    privateKey: string
    publicKey: string
  } {
    const prefix = 'ED'
    const rawPrivateKey = hash(entropy)
    const privateKey = prefix + bytesToHex(rawPrivateKey)
    const publicKey =
      prefix + bytesToHex(nobleEd25519.ed25519.getPublicKey(rawPrivateKey))
    return { privateKey, publicKey }
  },

  sign(message, privateKey: string): string {
    // TODO: callers without 33 bytes (including 0xED prefix) ?
    // TODO: this could be fixed
    // caution: Ed25519.sign interprets all strings as hex, stripping
    // any non-hex characters without warning
    assert.ok(Array.isArray(message), 'message must be array of octets')
    assert.ok(
      privateKey.length === 66,
      'private key must be 33 bytes including prefix',
    )
    return bytesToHex(
      nobleEd25519.ed25519.sign(Buffer.from(message), privateKey.slice(2)),
    )
  },

  verify(message, signature, publicKey): boolean {
    return nobleEd25519.ed25519.verify(
      signature,
      Buffer.from(message),
      publicKey.slice(2),
    )
  },
}

function select(algorithm): any {
  const methods = { 'ecdsa-secp256k1': secp256k1, ed25519 }
  return methods[algorithm]
}

function deriveKeypair(
  seed: string,
  options?: object,
): {
  publicKey: string
  privateKey: string
} {
  const decoded = addressCodec.decodeSeed(seed)
  const algorithm = decoded.type === 'ed25519' ? 'ed25519' : 'ecdsa-secp256k1'
  const method = select(algorithm)
  const keypair = method.deriveKeypair(decoded.bytes, options)
  const messageToVerify = Array.from(hash('This test message should verify.'))
  const signature = method.sign(messageToVerify, keypair.privateKey)
  /* istanbul ignore if */
  if (method.verify(messageToVerify, signature, keypair.publicKey) !== true) {
    throw new Error('derived keypair did not generate verifiable signature')
  }
  return keypair
}

function getAlgorithmFromKey(key): 'ed25519' | 'ecdsa-secp256k1' {
  const bytes = hexToBytes(key)
  return bytes.length === 33 && bytes[0] === 0xed
    ? 'ed25519'
    : 'ecdsa-secp256k1'
}

function sign(messageHex, privateKey): string {
  const algorithm = getAlgorithmFromKey(privateKey)
  return select(algorithm).sign(hexToBytes(messageHex), privateKey)
}

function verify(messageHex, signature, publicKey): boolean {
  const algorithm = getAlgorithmFromKey(publicKey)
  return select(algorithm).verify(hexToBytes(messageHex), signature, publicKey)
}

function deriveAddressFromBytes(publicKeyBytes: Buffer): string {
  return addressCodec.encodeAccountID(
    utils.computePublicKeyHash(publicKeyBytes),
  )
}

function deriveAddress(publicKey): string {
  return deriveAddressFromBytes(Buffer.from(hexToBytes(publicKey)))
}

function deriveNodeAddress(publicKey): string {
  const generatorBytes = addressCodec.decodeNodePublic(publicKey)
  const accountPublicBytes = accountPublicFromPublicGenerator(generatorBytes)
  return deriveAddressFromBytes(Buffer.from(accountPublicBytes))
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
