import {
  encryptAmount,
  generateBlindingFactor,
  getClawbackProof,
  getConfidentialSendProof,
  getConvertBackProof,
  getConvertProof,
  getPedersenCommitment,
} from '../src'

const PUBLIC_KEY =
  '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020'
const PRIVATE_KEY =
  '1ACAAEDECE405B2A958212629E16F2EB46B153EEE94CDD350FDEFF52795525B7'
// Distinct secp256k1 public keys for the destination, issuer, and auditor
// participants (the send proof only encrypts to them, so their private keys are
// not needed here).
const DEST_KEY =
  '039DA5E1E7CB517D0039C2E1DA01F81978EF6675694C65A285D67B79F09588B143'
const ISSUER_KEY =
  '038EA8465AC65D2F2EE9D68CA619586E51A740F5BA8A80A3769BBDCA2F97427581'
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

  it('getConfidentialSendProof returns a 946-byte proof', async () => {
    const amount = 100n
    const balance = 1000n
    const [txBlinding, rho, balanceRandomness] = await Promise.all([
      generateBlindingFactor(),
      generateBlindingFactor(),
      generateBlindingFactor(),
    ])
    const [
      amountCommitment,
      balanceCommitment,
      senderCt,
      destCt,
      issuerCt,
      spending,
    ] = await Promise.all([
      getPedersenCommitment(amount, txBlinding),
      getPedersenCommitment(balance, rho),
      encryptAmount(amount, PUBLIC_KEY, txBlinding),
      encryptAmount(amount, DEST_KEY, txBlinding),
      encryptAmount(amount, ISSUER_KEY, txBlinding),
      encryptAmount(balance, PUBLIC_KEY, balanceRandomness),
    ])
    const proof = await getConfidentialSendProof({
      privateKey: PRIVATE_KEY,
      publicKey: PUBLIC_KEY,
      amount,
      participants: [
        { publicKey: PUBLIC_KEY, ciphertext: senderCt },
        { publicKey: DEST_KEY, ciphertext: destCt },
        { publicKey: ISSUER_KEY, ciphertext: issuerCt },
      ],
      txBlindingFactor: txBlinding,
      contextHash: CONTEXT_HASH,
      amountCommitment,
      balanceParams: {
        commitment: balanceCommitment,
        amount: balance,
        ciphertext: spending,
        blindingFactor: rho,
      },
    })
    expect(proof).toHaveLength(1892)
  })

  it('getConfidentialSendProof supports an extra (auditor) participant', async () => {
    const amount = 100n
    const balance = 1000n
    const [txBlinding, rho, balanceRandomness] = await Promise.all([
      generateBlindingFactor(),
      generateBlindingFactor(),
      generateBlindingFactor(),
    ])
    // A fourth participant reuses a key here only to vary participants.length;
    // the proof size is fixed regardless of the participant count.
    const [amountCommitment, balanceCommitment, spending] = await Promise.all([
      getPedersenCommitment(amount, txBlinding),
      getPedersenCommitment(balance, rho),
      encryptAmount(balance, PUBLIC_KEY, balanceRandomness),
    ])
    const participants = await Promise.all(
      [PUBLIC_KEY, DEST_KEY, ISSUER_KEY, DEST_KEY].map(async (publicKey) => ({
        publicKey,
        ciphertext: await encryptAmount(amount, publicKey, txBlinding),
      })),
    )
    const proof = await getConfidentialSendProof({
      privateKey: PRIVATE_KEY,
      publicKey: PUBLIC_KEY,
      amount,
      participants,
      txBlindingFactor: txBlinding,
      contextHash: CONTEXT_HASH,
      amountCommitment,
      balanceParams: {
        commitment: balanceCommitment,
        amount: balance,
        ciphertext: spending,
        blindingFactor: rho,
      },
    })
    expect(proof).toHaveLength(1892)
  })

  it('rejects a malformed context hash', async () => {
    await expect(
      getConvertProof(PUBLIC_KEY, PRIVATE_KEY, 'A1A1'),
    ).rejects.toThrow(/contextHash/u)
  })

  // Each proof builder passes its `amount` straight to a WASM i64 param, which
  // wraps silently on overflow — so an out-of-range amount is rejected up front.
  it('getClawbackProof rejects an out-of-range amount', async () => {
    await expect(
      getClawbackProof(
        PRIVATE_KEY,
        PUBLIC_KEY,
        CONTEXT_HASH,
        2n ** 64n,
        'CD'.repeat(66),
      ),
    ).rejects.toThrow(/amount/u)
  })

  it('getConvertBackProof rejects an out-of-range amount', async () => {
    await expect(
      getConvertBackProof(PRIVATE_KEY, PUBLIC_KEY, CONTEXT_HASH, 2n ** 64n, {
        commitment: 'AB'.repeat(33),
        amount: 100n,
        ciphertext: 'CD'.repeat(66),
        blindingFactor: 'EF'.repeat(32),
      }),
    ).rejects.toThrow(/amount/u)
  })

  it('getConfidentialSendProof rejects an out-of-range amount', async () => {
    await expect(
      getConfidentialSendProof({
        privateKey: PRIVATE_KEY,
        publicKey: PUBLIC_KEY,
        amount: 2n ** 64n,
        participants: [{ publicKey: PUBLIC_KEY, ciphertext: 'CD'.repeat(66) }],
        txBlindingFactor: 'EF'.repeat(32),
        contextHash: CONTEXT_HASH,
        amountCommitment: 'AB'.repeat(33),
        balanceParams: {
          commitment: 'AB'.repeat(33),
          amount: 1000n,
          ciphertext: 'CD'.repeat(66),
          blindingFactor: 'EF'.repeat(32),
        },
      }),
    ).rejects.toThrow(/amount/u)
  })

  it('rejects a send proof with a wrong-length amount commitment', async () => {
    const txBlinding = await generateBlindingFactor()
    const senderCt = await encryptAmount(100n, PUBLIC_KEY, txBlinding)
    await expect(
      getConfidentialSendProof({
        privateKey: PRIVATE_KEY,
        publicKey: PUBLIC_KEY,
        amount: 100n,
        participants: [{ publicKey: PUBLIC_KEY, ciphertext: senderCt }],
        txBlindingFactor: txBlinding,
        contextHash: CONTEXT_HASH,
        amountCommitment: 'AB',
        balanceParams: {
          commitment: 'AB'.repeat(33),
          amount: 1000n,
          ciphertext: 'CD'.repeat(66),
          blindingFactor: 'EF'.repeat(32),
        },
      }),
    ).rejects.toThrow(/amountCommitment/u)
  })

  it('getConfidentialSendProof rejects an empty participants list', async () => {
    await expect(
      getConfidentialSendProof({
        privateKey: PRIVATE_KEY,
        publicKey: PUBLIC_KEY,
        amount: 100n,
        participants: [],
        txBlindingFactor: 'EF'.repeat(32),
        contextHash: CONTEXT_HASH,
        amountCommitment: 'AB'.repeat(33),
        balanceParams: {
          commitment: 'AB'.repeat(33),
          amount: 1000n,
          ciphertext: 'CD'.repeat(66),
          blindingFactor: 'EF'.repeat(32),
        },
      }),
    ).rejects.toThrow(/participants/u)
  })
})
