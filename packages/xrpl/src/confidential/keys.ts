import { deriveKeypair, generateSeed } from 'ripple-keypairs'

import ECDSA from '../ECDSA'

import type { ConfidentialKeypair } from './types'

/**
 * Derive a Confidential MPT (XLS-0096) encryption keypair — the secp256k1 key
 * used to encrypt to, and decrypt from, a confidential balance and its inbox.
 * This is separate from an account's signing key.
 *
 * Pass a `seed` to derive the keypair deterministically: the same seed always
 * yields the same key, so the ability to decrypt a confidential balance can
 * be recovered from a backed-up secret. Omit `seed` for a fresh random key.
 *
 * Any family seed works, including an account's own signing seed — secp256k1
 * is forced regardless of the seed's algorithm, so one secret can back both
 * the signing and confidential keys.
 *
 * @param seed - An optional family seed to derive from; a fresh secp256k1
 * seed is generated when omitted.
 * @returns A confidential keypair: a 33-byte hex `publicKey` and the bare
 * 32-byte hex `privateKey` scalar.
 */
export function deriveConfidentialKeypair(seed?: string): ConfidentialKeypair {
  const familySeed = seed ?? generateSeed({ algorithm: ECDSA.secp256k1 })
  const { publicKey, privateKey } = deriveKeypair(familySeed, {
    algorithm: ECDSA.secp256k1,
  })
  // ripple-keypairs tags secp256k1 private keys with a leading `00` byte; the
  // confidential crypto expects the bare 32-byte scalar.
  return { publicKey, privateKey: privateKey.slice(2) }
}
