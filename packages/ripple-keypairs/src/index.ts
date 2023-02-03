import * as assert from 'assert'
import brorand = require('brorand')
import * as hashjs from 'hash.js'
import * as elliptic from 'elliptic'

import * as addressCodec from 'ripple-address-codec'
import { derivePrivateKey, accountPublicFromPublicGenerator } from './secp256k1'
import * as utils from './utils'

const Ed25519 = elliptic.eddsa('ed25519')
const Secp256k1 = elliptic.ec('secp256k1')

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
  const entropy = options.entropy ? options.entropy.slice(0, 16) : brorand(16)
  const type = options.algorithm === 'ed25519' ? 'ed25519' : 'secp256k1'
  return addressCodec.encodeSeed(Buffer.from(entropy), type)
}

function hash(message): number[] {
  return hashjs.sha512().update(message).digest().slice(0, 32)
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

    const privateKey =
      prefix + derivePrivateKey(entropy, options).toString(16, 64).toUpperCase()

    const publicKey = bytesToHex(
      Secp256k1.keyFromPrivate(privateKey.slice(2))
        .getPublic()
        .encodeCompressed(),
    )
    return { privateKey, publicKey }
  },

  sign(message, privateKey): string {
    return bytesToHex(
      Secp256k1.sign(hash(message), hexToBytes(privateKey), {
        canonical: true,
      }).toDER(),
    )
  },

  verify(message, signature, publicKey): boolean {
    return Secp256k1.verify(hash(message), signature, hexToBytes(publicKey))
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
      prefix + bytesToHex(Ed25519.keyFromSecret(rawPrivateKey).pubBytes())
    return { privateKey, publicKey }
  },

  sign(message, privateKey): string {
    // caution: Ed25519.sign interprets all strings as hex, stripping
    // any non-hex characters without warning
    assert.ok(Array.isArray(message), 'message must be array of octets')
    return bytesToHex(
      Ed25519.sign(message, hexToBytes(privateKey).slice(1)).toBytes(),
    )
  },

  verify(message, signature, publicKey): boolean {
    return Ed25519.verify(
      message,
      hexToBytes(signature),
      hexToBytes(publicKey).slice(1),
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
  const messageToVerify = hash('This test message should verify.')
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
