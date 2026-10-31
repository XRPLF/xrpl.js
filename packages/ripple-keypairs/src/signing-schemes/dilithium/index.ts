import { ml_dsa44 as mlDsa44 } from '@noble/post-quantum/ml-dsa.js'
import { bytesToHex, hexToBytes } from '@xrplf/isomorphic/utils'

import type { HexString, SigningScheme } from '../../types'
import assert from '../../utils/assert'
import Sha512 from '../../utils/Sha512'

export const DILITHIUM_PRIVATE_KEY_BYTES = 2560
export const DILITHIUM_PUBLIC_KEY_BYTES = 1312

// ML-DSA-44 (FIPS 204) with an empty context, as xrpld's KeyType::Dilithium;
// the key generation seed is SHA-512-half of the 16-byte seed entropy.
const dilithium: SigningScheme = {
  deriveKeypair(entropy: Uint8Array): {
    privateKey: string
    publicKey: string
  } {
    const keys = mlDsa44.keygen(Sha512.half(entropy))
    return {
      privateKey: bytesToHex(keys.secretKey),
      publicKey: bytesToHex(keys.publicKey),
    }
  },

  sign(message: Uint8Array, privateKey: HexString): string {
    assert.ok(message instanceof Uint8Array, 'message must be array of octets')
    assert.ok(
      privateKey.length === DILITHIUM_PRIVATE_KEY_BYTES * 2,
      `private key must be ${DILITHIUM_PRIVATE_KEY_BYTES} bytes`,
    )
    return bytesToHex(mlDsa44.sign(message, hexToBytes(privateKey)))
  },

  verify(
    message: Uint8Array,
    signature: HexString,
    publicKey: string,
  ): boolean {
    // Unlikely to be triggered as these are internal and guarded by getAlgorithmFromKey
    assert.ok(
      publicKey.length === DILITHIUM_PUBLIC_KEY_BYTES * 2,
      `public key must be ${DILITHIUM_PUBLIC_KEY_BYTES} bytes`,
    )
    return mlDsa44.verify(hexToBytes(signature), message, hexToBytes(publicKey))
  },
}

export default dilithium
