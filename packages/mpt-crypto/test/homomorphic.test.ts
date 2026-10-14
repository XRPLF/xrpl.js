import {
  addCiphertexts,
  decryptAmount,
  encryptAmount,
  generateBlindingFactor,
  subtractCiphertexts,
} from '../src'

// Genesis secp256k1 keypair — the same deterministic fixture used by the
// primitives tests (ripple-keypairs `00` prefix stripped to the 32-byte scalar).
const PUBLIC_KEY =
  '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020'
const PRIVATE_KEY =
  '1ACAAEDECE405B2A958212629E16F2EB46B153EEE94CDD350FDEFF52795525B7'

/** Encrypt `amount` under the fixture key with fresh randomness. */
async function enc(amount: bigint): Promise<string> {
  return encryptAmount(amount, PUBLIC_KEY, await generateBlindingFactor())
}

describe('homomorphic', () => {
  it('subtractCiphertexts encrypts the difference of the plaintexts', async () => {
    const diff = await subtractCiphertexts(await enc(5n), await enc(3n))
    expect(diff).toHaveLength(132)
    expect(await decryptAmount(diff, PRIVATE_KEY, 1000n)).toBe(2n)
  })

  it('addCiphertexts encrypts the sum of the plaintexts', async () => {
    const sum = await addCiphertexts(await enc(5n), await enc(3n))
    expect(sum).toHaveLength(132)
    expect(await decryptAmount(sum, PRIVATE_KEY, 1000n)).toBe(8n)
  })

  it('chains debits like a Batch of sends (100 - 30 - 20 = 50)', async () => {
    let balance = await enc(100n)
    balance = await subtractCiphertexts(balance, await enc(30n))
    balance = await subtractCiphertexts(balance, await enc(20n))
    expect(await decryptAmount(balance, PRIVATE_KEY, 1000n)).toBe(50n)
  })

  it('add and subtract round-trip to the original balance', async () => {
    const balance = await enc(42n)
    const credit = await enc(8n)
    const after = await subtractCiphertexts(
      await addCiphertexts(balance, credit),
      credit,
    )
    expect(await decryptAmount(after, PRIVATE_KEY, 1000n)).toBe(42n)
  })

  it('rejects a malformed ciphertext', async () => {
    await expect(subtractCiphertexts('AABB', await enc(1n))).rejects.toThrow(
      /must be 66 bytes/u,
    )
  })
})
