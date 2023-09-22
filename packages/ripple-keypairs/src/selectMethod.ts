import {
  Algorithm,
  ByteArray,
  DeriveKeyPairOptions,
  HexString,
  SigningMethod,
} from './types'
import { derivePrivateKey } from './secp256k1'
import { bytesToHex } from '@xrplf/isomorphic/utils'
import { numberToBytesBE } from '@noble/curves/abstract/utils'
import { secp256k1 as nobleSecp256k1 } from '@noble/curves/secp256k1'
import assert from './assert'
import { ed25519 as nobleEd25519 } from '@noble/curves/ed25519'
import Sha512 from './Sha512'

const ED_PREFIX = 'ED'
const SECP256K1_PREFIX = '00'
const hash = Sha512.half

export const secp256k1: SigningMethod = {
  deriveKeypair(
    entropy: ByteArray,
    options?: DeriveKeyPairOptions,
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
    // @noble/curves will throw if the key is not exactly 32 bytes, so we
    // normalize it before passing to the sign method.
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

  verify(
    message: ByteArray,
    signature: HexString | Uint8Array,
    publicKey: HexString,
  ): boolean {
    const decoded = nobleSecp256k1.Signature.fromDER(signature)
    return nobleSecp256k1.verify(decoded, hash(message), publicKey)
  },
}

const ed25519: SigningMethod = {
  deriveKeypair(entropy: ByteArray): {
    privateKey: string
    publicKey: string
  } {
    const rawPrivateKey = hash(entropy)
    const privateKey = ED_PREFIX + bytesToHex(rawPrivateKey)
    const publicKey =
      ED_PREFIX + bytesToHex(nobleEd25519.getPublicKey(rawPrivateKey))
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

export function selectMethod(algorithm: Algorithm): SigningMethod {
  const methods = { 'ecdsa-secp256k1': secp256k1, ed25519 }
  return methods[algorithm]
}
