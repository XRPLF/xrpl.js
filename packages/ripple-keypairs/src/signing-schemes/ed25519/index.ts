import { ed25519 as nobleEd25519 } from '@noble/curves/ed25519'
import { bytesToHex } from '@xrplf/isomorphic/utils'

import type { HexString, SigningScheme } from '../../types'
import assert from '../../utils/assert'
import Sha512 from '../../utils/Sha512'

const ED_PREFIX = 'ED'

const ed25519: SigningScheme = {
  deriveKeypair(entropy: Uint8Array): {
    privateKey: string
    publicKey: string
  } {
    const rawPrivateKey = Sha512.half(entropy)
    const privateKey = ED_PREFIX + bytesToHex(rawPrivateKey)
    const publicKey =
      ED_PREFIX + bytesToHex(nobleEd25519.getPublicKey(rawPrivateKey))
    return { privateKey, publicKey }
  },

  sign(message: Uint8Array, privateKey: HexString): string {
    assert.ok(message instanceof Uint8Array, 'message must be array of octets')
    assert.ok(
      privateKey.length === 66,
      'private key must be 33 bytes including prefix',
    )
    return bytesToHex(nobleEd25519.sign(message, privateKey.slice(2)))
  },

  verify(
    message: Uint8Array,
    signature: HexString,
    publicKey: string,
  ): boolean {
    // Unlikely to be triggered as these are internal and guarded by getAlgorithmFromKey
    assert.ok(
      publicKey.length === 66,
      'public key must be 33 bytes including prefix',
    )
    return nobleEd25519.verify(
      signature,
      message,
      // Remove the 0xED prefix
      publicKey.slice(2),
      // By default, set zip215 to false for compatibility reasons.
      // ZIP 215 is a stricter Ed25519 signature verification scheme.
      // However, setting it to false adheres to the more commonly used
      // RFC8032 / NIST186-5 standards, making it compatible with systems
      // like the XRP Ledger.
      { zip215: false },
    )
  },
}

export default ed25519
