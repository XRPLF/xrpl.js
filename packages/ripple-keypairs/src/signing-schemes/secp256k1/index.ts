import { numberToBytesBE } from '@noble/curves/abstract/utils'
import { secp256k1 as nobleSecp256k1 } from '@noble/curves/secp256k1'
import { bytesToHex } from '@xrplf/isomorphic/utils'

import { DeriveKeyPairOptions, HexOrU8Array, SigningScheme } from '../../types'

import { derivePrivateKey } from './utils'
import assert from '../../utils/assert'
import Sha512 from '../../utils/Sha512'
import ensureU8Array from '../../utils/ensureU8Array'

const SECP256K1_PREFIX_HEX = '00'
const SECP256K1_PREFIX = 0x00

const secp256k1: SigningScheme = {
  deriveKeypair(
    entropy: HexOrU8Array,
    options?: DeriveKeyPairOptions,
  ): {
    privateKey: string
    publicKey: string
  } {
    const derived = derivePrivateKey(ensureU8Array(entropy, 'entropy'), options)
    const privateKey =
      SECP256K1_PREFIX_HEX + bytesToHex(numberToBytesBE(derived, 32))

    const publicKey = bytesToHex(nobleSecp256k1.getPublicKey(derived, true))
    return { privateKey, publicKey }
  },

  sign(message: HexOrU8Array, privateKey: HexOrU8Array): string {
    // Some callers pass the privateKey with the prefix, others without.
    // @noble/curves will throw if the key is not exactly 32 bytes, so we
    // normalize it before passing to the sign method.
    const privateU8Array = ensureU8Array(privateKey, 'private key')
    assert.ok(
      (privateU8Array.length === 33 &&
        privateU8Array[0] === SECP256K1_PREFIX) ||
        privateU8Array.length === 32,
    )
    const normedPrivateKey =
      privateU8Array.length === 33 ? privateU8Array.slice(1) : privateU8Array
    return nobleSecp256k1
      .sign(Sha512.half(ensureU8Array(message, 'message')), normedPrivateKey, {
        // "Canonical" signatures
        lowS: true,
        // Would fail tests if signatures aren't deterministic
        extraEntropy: undefined,
      })
      .toDERHex(true)
      .toUpperCase()
  },

  verify(
    message: HexOrU8Array,
    signature: HexOrU8Array,
    publicKey: HexOrU8Array,
  ): boolean {
    const decoded = nobleSecp256k1.Signature.fromDER(signature)
    return nobleSecp256k1.verify(
      decoded,
      Sha512.half(ensureU8Array(message, 'message')),
      publicKey,
    )
  },
}

export default secp256k1
