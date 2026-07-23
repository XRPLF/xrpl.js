import {
  decryptAmount,
  encryptAmount,
  generateBlindingFactor,
  getPedersenCommitment,
} from '../src'

// Genesis secp256k1 keypair — a deterministic fixture (the ripple-keypairs `00`
// prefix stripped to the bare 32-byte scalar).
const PUBLIC_KEY =
  '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020'
const PRIVATE_KEY =
  '1ACAAEDECE405B2A958212629E16F2EB46B153EEE94CDD350FDEFF52795525B7'

describe('primitives', () => {
  it('generateBlindingFactor returns a fresh 32-byte scalar', async () => {
    const first = await generateBlindingFactor()
    const second = await generateBlindingFactor()
    expect(first).toHaveLength(64)
    expect(first).not.toBe(second)
  })

  it('encrypts then decrypts back to the original amount', async () => {
    // A ciphertext is 132 hex chars — the 66-byte (C1 || C2) ElGamal pair.
    await Promise.all(
      [0n, 1n, 1000n].map(async (amount) => {
        const blinding = await generateBlindingFactor()
        const ciphertext = await encryptAmount(amount, PUBLIC_KEY, blinding)
        expect(ciphertext).toHaveLength(132)
        expect(await decryptAmount(ciphertext, PRIVATE_KEY)).toBe(amount)
      }),
    )
  })

  it('encryptAmount is deterministic for a fixed blinding factor', async () => {
    const blinding = await generateBlindingFactor()
    expect(await encryptAmount(42n, PUBLIC_KEY, blinding)).toBe(
      await encryptAmount(42n, PUBLIC_KEY, blinding),
    )
  })

  it('getPedersenCommitment is deterministic and 33 bytes', async () => {
    const blinding = await generateBlindingFactor()
    const commitment = await getPedersenCommitment(500n, blinding)
    expect(commitment).toHaveLength(66)
    expect(await getPedersenCommitment(500n, blinding)).toBe(commitment)
  })

  it('rejects a malformed public key', async () => {
    const blinding = await generateBlindingFactor()
    await expect(encryptAmount(1n, 'AABB', blinding)).rejects.toThrow(
      /publicKey/u,
    )
  })
})
