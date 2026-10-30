import { ELGAMAL_TOTAL_SIZE } from './constants'
import { bytesToHex, hexToBytes } from './hex'
import { withModule } from './runtime'

// sizeof(secp256k1_pubkey): an opaque `unsigned char data[64]` struct. The
// homomorphic ops take/return these parsed points, so we bridge to and from the
// 66-byte (C1 || C2) wire ciphertext via _mpt_make_ec_pair / _mpt_serialize_ec_pair.
const PUBKEY_STRUCT_SIZE = 64

// The EC-pair bridge and elgamal add/subtract return 1 on success (secp256k1's
// bool convention), unlike the encrypt/decrypt/proof primitives, which return 0.
const WASM_OK = 1

/**
 * Homomorphically combine two ElGamal ciphertexts under the same public key.
 *
 * A confidential balance and an encrypted amount are both ElGamal ciphertexts
 * (`C1 || C2`, two 33-byte compressed points). The scheme is additively
 * homomorphic, so this yields an encryption of `plaintext(a) ± plaintext(b)`
 * without decrypting — the basis for predicting an account's post-transaction
 * confidential balance when chaining transactions inside a Batch.
 *
 * @param a - A 66-byte hex ciphertext.
 * @param b - A 66-byte hex ciphertext under the same key.
 * @param op - Whether to add or subtract `b`.
 * @returns The 66-byte hex combined ciphertext.
 * @throws If either input is malformed or a WASM call fails.
 */
/* eslint-disable max-lines-per-function -- one cohesive WASM marshalling flow; splitting obscures the pointer threading */
async function combineCiphertexts(
  a: string,
  b: string,
  op: 'add' | 'subtract',
): Promise<string> {
  const aBytes = hexToBytes(a, 'a', ELGAMAL_TOTAL_SIZE)
  const bBytes = hexToBytes(b, 'b', ELGAMAL_TOTAL_SIZE)
  return withModule((mod, marshaller) => {
    const ctx = mod._mpt_secp256k1_context()
    if (ctx === 0) {
      throw new Error('mpt-crypto: secp256k1 context unavailable')
    }
    const aPtr = marshaller.allocBytes(aBytes)
    const bPtr = marshaller.allocBytes(bBytes)
    // Two parsed points per input, plus two for the result.
    const a1 = marshaller.alloc(PUBKEY_STRUCT_SIZE)
    const a2 = marshaller.alloc(PUBKEY_STRUCT_SIZE)
    const b1 = marshaller.alloc(PUBKEY_STRUCT_SIZE)
    const b2 = marshaller.alloc(PUBKEY_STRUCT_SIZE)
    const o1 = marshaller.alloc(PUBKEY_STRUCT_SIZE)
    const o2 = marshaller.alloc(PUBKEY_STRUCT_SIZE)
    if (mod._mpt_make_ec_pair(aPtr, a1, a2) !== WASM_OK) {
      throw new Error('mpt-crypto: failed to parse ciphertext a')
    }
    if (mod._mpt_make_ec_pair(bPtr, b1, b2) !== WASM_OK) {
      throw new Error('mpt-crypto: failed to parse ciphertext b')
    }
    const rc =
      op === 'add'
        ? mod._secp256k1_elgamal_add(ctx, o1, o2, a1, a2, b1, b2)
        : mod._secp256k1_elgamal_subtract(ctx, o1, o2, a1, a2, b1, b2)
    if (rc !== WASM_OK) {
      throw new Error(`mpt-crypto: elgamal ${op} failed`)
    }
    const outPtr = marshaller.alloc(ELGAMAL_TOTAL_SIZE)
    if (mod._mpt_serialize_ec_pair(o1, o2, outPtr) !== WASM_OK) {
      throw new Error('mpt-crypto: failed to serialize combined ciphertext')
    }
    return bytesToHex(marshaller.readBytes(outPtr, ELGAMAL_TOTAL_SIZE))
  })
}
/* eslint-enable max-lines-per-function */

/**
 * Homomorphic addition of two same-key ElGamal ciphertexts.
 *
 * @param a - A 66-byte hex ciphertext (`C1 || C2`).
 * @param b - A 66-byte hex ciphertext under the same key.
 * @returns A 66-byte hex ciphertext encrypting `plaintext(a) + plaintext(b)`.
 * @throws If either input is malformed or a WASM call fails.
 */
export async function addCiphertexts(a: string, b: string): Promise<string> {
  return combineCiphertexts(a, b, 'add')
}

/**
 * Homomorphic subtraction of two same-key ElGamal ciphertexts.
 *
 * @param a - A 66-byte hex ciphertext (`C1 || C2`).
 * @param b - A 66-byte hex ciphertext under the same key.
 * @returns A 66-byte hex ciphertext encrypting `plaintext(a) - plaintext(b)`.
 * @throws If either input is malformed or a WASM call fails.
 */
export async function subtractCiphertexts(
  a: string,
  b: string,
): Promise<string> {
  return combineCiphertexts(a, b, 'subtract')
}
