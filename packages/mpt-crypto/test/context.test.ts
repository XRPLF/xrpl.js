import {
  getClawbackContextHash,
  getConvertBackContextHash,
  getConvertContextHash,
  getSendContextHash,
} from '../src'

const ACCOUNT = 'AB'.repeat(20) // 20-byte AccountID
const ISSUANCE = 'CD'.repeat(24) // 24-byte MPTokenIssuanceID
const OTHER = 'EF'.repeat(20) // destination / holder AccountID

describe('context hashes', () => {
  it('convert context hash is deterministic and 32 bytes', async () => {
    const hash = await getConvertContextHash(ACCOUNT, ISSUANCE, 5)
    expect(hash).toHaveLength(64)
    expect(await getConvertContextHash(ACCOUNT, ISSUANCE, 5)).toBe(hash)
  })

  it('convert context hash changes with the sequence', async () => {
    expect(await getConvertContextHash(ACCOUNT, ISSUANCE, 5)).not.toBe(
      await getConvertContextHash(ACCOUNT, ISSUANCE, 6),
    )
  })

  it('each transaction type yields a distinct 32-byte hash', async () => {
    const hashes = [
      await getConvertContextHash(ACCOUNT, ISSUANCE, 1),
      await getConvertBackContextHash(ACCOUNT, ISSUANCE, 1, 0),
      await getSendContextHash(ACCOUNT, ISSUANCE, 1, OTHER, 0),
      await getClawbackContextHash(ACCOUNT, ISSUANCE, 1, OTHER),
    ]
    for (const hash of hashes) {
      expect(hash).toHaveLength(64)
    }
    expect(new Set(hashes).size).toBe(4)
  })

  it('rejects a wrong-size account id', async () => {
    await expect(getConvertContextHash('AABB', ISSUANCE, 1)).rejects.toThrow(
      /account/u,
    )
  })
})
