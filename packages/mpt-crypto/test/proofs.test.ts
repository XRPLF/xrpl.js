import {
  encryptAmount,
  generateBlindingFactor,
  getClawbackProof,
  getConvertBackProof,
  getConvertProof,
  getPedersenCommitment,
} from '../src'

const PUBLIC_KEY =
  '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020'
const PRIVATE_KEY =
  '1ACAAEDECE405B2A958212629E16F2EB46B153EEE94CDD350FDEFF52795525B7'
const CONTEXT_HASH = 'A1'.repeat(32)

// The proof generators use random nonces, so their output is not deterministic;
// these assert the marshalling round-trips and each proof is the expected size.
describe('proofs', () => {
  it('getConvertProof returns a 64-byte proof', async () => {
    const proof = await getConvertProof(PUBLIC_KEY, PRIVATE_KEY, CONTEXT_HASH)
    expect(proof).toHaveLength(128)
  })

  it('getClawbackProof returns a 64-byte proof', async () => {
    const blinding = await generateBlindingFactor()
    const ciphertext = await encryptAmount(100n, PUBLIC_KEY, blinding)
    const proof = await getClawbackProof(
      PRIVATE_KEY,
      PUBLIC_KEY,
      CONTEXT_HASH,
      100n,
      ciphertext,
    )
    expect(proof).toHaveLength(128)
  })

  it('getConvertBackProof returns an 816-byte proof', async () => {
    const rho = await generateBlindingFactor()
    const randomness = await generateBlindingFactor()
    const commitment = await getPedersenCommitment(100n, rho)
    const ciphertext = await encryptAmount(100n, PUBLIC_KEY, randomness)
    const proof = await getConvertBackProof(
      PRIVATE_KEY,
      PUBLIC_KEY,
      CONTEXT_HASH,
      100n,
      { commitment, amount: 100n, ciphertext, blindingFactor: rho },
    )
    expect(proof).toHaveLength(1632)
  })

  it('rejects a malformed context hash', async () => {
    await expect(
      getConvertProof(PUBLIC_KEY, PRIVATE_KEY, 'A1A1'),
    ).rejects.toThrow(/contextHash/u)
  })
})
