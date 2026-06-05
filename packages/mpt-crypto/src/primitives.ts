import {
  BLINDING_FACTOR_SIZE,
  ELGAMAL_TOTAL_SIZE,
  PEDERSEN_COMMIT_SIZE,
  PRIVKEY_SIZE,
  PUBKEY_SIZE,
} from './constants'
import { bytesToHex, hexToBytes } from './hex'
import { withModule } from './runtime'

const U64_BYTES = 8

/**
 * Generate a 32-byte blinding factor / ElGamal randomness scalar.
 *
 * @returns The hex-encoded blinding factor.
 * @throws If the underlying WASM call fails.
 */
export async function generateBlindingFactor(): Promise<string> {
  return withModule((mod, marshaller) => {
    const ptr = marshaller.alloc(BLINDING_FACTOR_SIZE)
    if (mod._mpt_generate_blinding_factor(ptr) !== 0) {
      throw new Error('mpt_generate_blinding_factor failed')
    }
    return bytesToHex(marshaller.readBytes(ptr, BLINDING_FACTOR_SIZE))
  })
}

/**
 * ElGamal-encrypt an amount under a public key.
 *
 * @param amount - The integer amount to encrypt.
 * @param publicKey - The 33-byte hex public key.
 * @param blindingFactor - The 32-byte hex randomness scalar.
 * @returns The 66-byte hex ciphertext (C1 || C2).
 * @throws If inputs are malformed or the WASM call fails.
 */
export async function encryptAmount(
  amount: bigint,
  publicKey: string,
  blindingFactor: string,
): Promise<string> {
  const pub = hexToBytes(publicKey, 'publicKey', PUBKEY_SIZE)
  const blinding = hexToBytes(
    blindingFactor,
    'blindingFactor',
    BLINDING_FACTOR_SIZE,
  )
  return withModule((mod, marshaller) => {
    const pubPtr = marshaller.allocBytes(pub)
    const blindingPtr = marshaller.allocBytes(blinding)
    const outPtr = marshaller.alloc(ELGAMAL_TOTAL_SIZE)
    if (mod._mpt_encrypt_amount(amount, pubPtr, blindingPtr, outPtr) !== 0) {
      throw new Error('mpt_encrypt_amount failed')
    }
    return bytesToHex(marshaller.readBytes(outPtr, ELGAMAL_TOTAL_SIZE))
  })
}

/**
 * Decrypt an ElGamal ciphertext with a private key.
 *
 * @param ciphertext - The 66-byte hex ciphertext.
 * @param privateKey - The 32-byte hex private key.
 * @returns The decrypted integer amount.
 * @throws If inputs are malformed or the WASM call fails.
 */
export async function decryptAmount(
  ciphertext: string,
  privateKey: string,
): Promise<bigint> {
  const ct = hexToBytes(ciphertext, 'ciphertext', ELGAMAL_TOTAL_SIZE)
  const priv = hexToBytes(privateKey, 'privateKey', PRIVKEY_SIZE)
  return withModule((mod, marshaller) => {
    const ctPtr = marshaller.allocBytes(ct)
    const privPtr = marshaller.allocBytes(priv)
    const outPtr = marshaller.alloc(U64_BYTES)
    if (mod._mpt_decrypt_amount(ctPtr, privPtr, outPtr) !== 0) {
      throw new Error('mpt_decrypt_amount failed')
    }
    return marshaller.readU64(outPtr)
  })
}

/**
 * Compute a Pedersen commitment `amount*G + blindingFactor*H`.
 *
 * @param amount - The integer amount to commit to.
 * @param blindingFactor - The 32-byte hex blinding scalar (rho).
 * @returns The 33-byte hex commitment point.
 * @throws If inputs are malformed or the WASM call fails.
 */
export async function getPedersenCommitment(
  amount: bigint,
  blindingFactor: string,
): Promise<string> {
  const blinding = hexToBytes(
    blindingFactor,
    'blindingFactor',
    BLINDING_FACTOR_SIZE,
  )
  return withModule((mod, marshaller) => {
    const blindingPtr = marshaller.allocBytes(blinding)
    const outPtr = marshaller.alloc(PEDERSEN_COMMIT_SIZE)
    if (mod._mpt_get_pedersen_commitment(amount, blindingPtr, outPtr) !== 0) {
      throw new Error('mpt_get_pedersen_commitment failed')
    }
    return bytesToHex(marshaller.readBytes(outPtr, PEDERSEN_COMMIT_SIZE))
  })
}
