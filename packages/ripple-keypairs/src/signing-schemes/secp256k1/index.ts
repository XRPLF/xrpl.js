import { numberToBytesBE } from '@noble/curves/abstract/utils'
import { secp256k1 as nobleSecp256k1 } from '@noble/curves/secp256k1'
import { bytesToHex } from '@xrplf/isomorphic/utils'

import type {
  DeriveKeyPairOptions,
  HexString,
  SigningScheme,
} from '../../types'

import { derivePrivateKey } from './utils'
import assert from '../../utils/assert'
import Sha512 from '../../utils/Sha512'

const SECP256K1_PREFIX = '00'

const secp256k1: SigningScheme = {
  deriveKeypair(
    entropy: Uint8Array,
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

  sign(message: Uint8Array, privateKey: HexString): string {
    // Some callers pass the privateKey with the prefix, others without.
    // @noble/curves will throw if the key is not exactly 32 bytes, so we
    // normalize it before passing to the sign method.
    assert.ok(
      (privateKey.length === 66 && privateKey.startsWith(SECP256K1_PREFIX)) ||
        privateKey.length === 64,
    )
    const normedPrivateKey =
      privateKey.length === 66 ? privateKey.slice(2) : privateKey
    return nobleSecp256k1
      .sign(Sha512.half(message), normedPrivateKey, {
        // "Canonical" signatures
        lowS: true,
        // Would fail tests if signatures aren't deterministic
        extraEntropy: undefined,
      })
      .toDERHex(true)
      .toUpperCase()
  },

  verify(
    message: Uint8Array,
    signature: HexString,
    publicKey: HexString,
  ): boolean {
    const decoded = nobleSecp256k1.Signature.fromDER(signature)
    return nobleSecp256k1.verify(decoded, Sha512.half(message), publicKey)
  },
}

export default secp256k1
