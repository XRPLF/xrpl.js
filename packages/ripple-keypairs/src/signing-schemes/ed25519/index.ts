import { ed25519 as nobleEd25519 } from '@noble/curves/ed25519'
import { bytesToHex } from '@xrplf/isomorphic/utils'

import { HexOrU8Array, SigningScheme } from '../../types'
import Sha512 from '../../utils/Sha512'
import ensureU8Array from '../../utils/ensureU8Array'

const ED_PREFIX = 'ED'

const ed25519: SigningScheme = {
  deriveKeypair(entropy: HexOrU8Array): {
    privateKey: string
    publicKey: string
  } {
    const rawPrivateKey = Sha512.half(ensureU8Array(entropy, 'entropy'))
    const privateKey = ED_PREFIX + bytesToHex(rawPrivateKey)
    const publicKey =
      ED_PREFIX + bytesToHex(nobleEd25519.getPublicKey(rawPrivateKey))
    return { privateKey, publicKey }
  },

  sign(message: HexOrU8Array, privateKey: HexOrU8Array): string {
    // noinspection SuspiciousTypeOfGuard
    const privateU8Array = ensureU8Array(
      privateKey,
      'private key with 0xED prefix',
      33,
    )
    return bytesToHex(nobleEd25519.sign(message, privateU8Array.slice(1)))
  },

  verify(
    message: HexOrU8Array,
    signature: HexOrU8Array,
    publicKeys: HexOrU8Array,
  ): boolean {
    const publicU8Array = ensureU8Array(
      publicKeys,
      'public key with 0xED prefix',
      33,
    )
    return nobleEd25519.verify(
      signature,
      message,
      // Remove the 0xED prefix
      publicU8Array.slice(1),
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
