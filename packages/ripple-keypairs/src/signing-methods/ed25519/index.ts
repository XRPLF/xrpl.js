import { ed25519 as nobleEd25519 } from '@noble/curves/ed25519'
import { bytesToHex } from '@xrplf/isomorphic/utils'

import { HexString, SigningMethod } from '../../types'
import assert from '../../utils/assert'
import Sha512 from '../../utils/Sha512'

const ED_PREFIX = 'ED'

const ed25519: SigningMethod = {
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
    message: Uint8Array,
    signature: HexString,
    publicKey: string,
  ): boolean {
    return nobleEd25519.verify(
      signature,
      new Uint8Array(message),
      publicKey.slice(2),
    )
  },
}

export default ed25519
