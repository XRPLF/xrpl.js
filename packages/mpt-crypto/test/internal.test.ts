import {
  assertUint64,
  rawParticipant,
  rawPedersenParams,
  U64_MAX,
} from '../src/internal'

// 33-byte public key / commitment, 66-byte ciphertext, 32-byte blinding factor,
// all as even-length hex. These decode without touching the WASM module.
const PUBLIC_KEY = `02${'AB'.repeat(32)}`
const CIPHERTEXT = 'CD'.repeat(66)
const COMMITMENT = 'AB'.repeat(33)
const BLINDING = 'EF'.repeat(32)

describe('assertUint64', () => {
  it('accepts the full unsigned 64-bit range endpoints', () => {
    expect(() => assertUint64(0n, 'amount')).not.toThrow()
    expect(() => assertUint64(U64_MAX, 'amount')).not.toThrow()
  })

  it('rejects a negative value with a labeled error', () => {
    expect(() => assertUint64(-1n, 'amount')).toThrow(
      /amount must be an integer/u,
    )
  })

  it('rejects a value above 2^64 - 1 (would wrap when marshalled)', () => {
    expect(() => assertUint64(U64_MAX + 1n, 'amount')).toThrow(/amount/u)
  })

  it('respects a custom inclusive max', () => {
    // e.g. decrypt rangeHigh must be < UINT64_MAX, so its max is U64_MAX - 1.
    const max = U64_MAX - 1n
    expect(() => assertUint64(max, 'rangeHigh', max)).not.toThrow()
    expect(() => assertUint64(max + 1n, 'rangeHigh', max)).toThrow(/rangeHigh/u)
  })
})

describe('internal marshalling helpers', () => {
  describe('rawParticipant', () => {
    it('decodes a well-formed participant to fixed-size byte fields', () => {
      const raw = rawParticipant(
        { publicKey: PUBLIC_KEY, ciphertext: CIPHERTEXT },
        'participants[0]',
      )
      expect(raw.publicKey).toHaveLength(33)
      expect(raw.ciphertext).toHaveLength(66)
    })

    it('rejects a wrong-length public key with a labeled error', () => {
      expect(() =>
        rawParticipant(
          { publicKey: 'AB'.repeat(20), ciphertext: CIPHERTEXT },
          'participants[0]',
        ),
      ).toThrow(/participants\[0\]\.publicKey must be 33 bytes/u)
    })

    it('rejects a malformed ciphertext with a labeled error', () => {
      expect(() =>
        rawParticipant(
          { publicKey: PUBLIC_KEY, ciphertext: 'zz' },
          'participants[1]',
        ),
      ).toThrow(/participants\[1\]\.ciphertext must be an even-length hex/u)
    })
  })

  describe('rawPedersenParams', () => {
    it('decodes a well-formed witness and passes the amount through', () => {
      const raw = rawPedersenParams(
        {
          commitment: COMMITMENT,
          amount: 100n,
          ciphertext: CIPHERTEXT,
          blindingFactor: BLINDING,
        },
        'balanceParams',
      )
      expect(raw.commitment).toHaveLength(33)
      expect(raw.ciphertext).toHaveLength(66)
      expect(raw.blindingFactor).toHaveLength(32)
      expect(raw.amount).toBe(100n)
    })

    it('rejects a wrong-length blinding factor with a labeled error', () => {
      expect(() =>
        rawPedersenParams(
          {
            commitment: COMMITMENT,
            amount: 100n,
            ciphertext: CIPHERTEXT,
            blindingFactor: 'EF'.repeat(16),
          },
          'balanceParams',
        ),
      ).toThrow(/balanceParams\.blindingFactor must be 32 bytes/u)
    })
  })
})
