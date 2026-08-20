import { decryptAmount } from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { type Client } from '../../src'
import { prepareConfidentialConvert } from '../../src/confidential'
import { XrplError } from '../../src/errors'

const ADDRESS = 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh'
const ISSUANCE_ID = 'AB'.repeat(24)
const PUBLIC_KEY =
  '0330E7FC9D56BB25D6893BA3F317AE5BCF33B3291BD63DB32654A313222F7FD020'
const PRIVATE_KEY =
  '1ACAAEDECE405B2A958212629E16F2EB46B153EEE94CDD350FDEFF52795525B7'

/**
 * A Client stub whose `ledger_entry` returns the given issuance and (optionally)
 * holder-MPToken nodes, branching on which entry each request asks for.
 *
 * @param issuanceNode - The MPTokenIssuance fields to return.
 * @param mptokenNode - The holder MPToken fields (default: none registered yet).
 * @returns A Client stub returning the requested node from `request`.
 */
function confidentialClient(
  issuanceNode: Record<string, unknown>,
  mptokenNode: Record<string, unknown> = {},
): Client {
  return {
    request: async (req: { mptoken?: unknown }) => ({
      result: { node: req.mptoken == null ? issuanceNode : mptokenNode },
    }),
    getLedgerIndex: async () => 100,
  } as unknown as Client
}

describe('confidential/prepareConfidentialConvert', function () {
  const holder = { publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY }
  // `sequence` is pinned so the builder never needs an account_info round-trip.
  const base = {
    account: ADDRESS,
    amount: 1000n,
    holderKeypair: holder,
    mptIssuanceID: ISSUANCE_ID,
    sequence: 5,
  }

  it('assembles a Convert whose ciphertext decrypts back to the amount', async function () {
    const client = confidentialClient({ IssuerEncryptionKey: PUBLIC_KEY })
    const tx = await prepareConfidentialConvert(client, base)

    assert.strictEqual(tx.TransactionType, 'ConfidentialMPTConvert')
    assert.strictEqual(tx.Account, ADDRESS)
    assert.strictEqual(tx.Sequence, 5)
    assert.strictEqual(tx.MPTokenIssuanceID, ISSUANCE_ID)
    assert.strictEqual(tx.MPTAmount, '1000')
    // 66-byte ElGamal ciphertexts, 32-byte blinding factor
    assert.lengthOf(tx.BlindingFactor, 64)
    assert.lengthOf(tx.HolderEncryptedAmount, 132)
    assert.lengthOf(tx.IssuerEncryptedAmount, 132)
    // no holder key on the ledger yet → the key + 64-byte Schnorr proof attach
    assert.strictEqual(tx.HolderEncryptionKey, PUBLIC_KEY)
    assert.isString(tx.ZKProof)
    assert.lengthOf(tx.ZKProof as string, 128)
    // end-to-end: the holder ciphertext the builder produced decrypts correctly
    assert.strictEqual(
      await decryptAmount(tx.HolderEncryptedAmount, PRIVATE_KEY, 10_000n),
      1000n,
    )
  })

  it('omits HolderEncryptionKey/ZKProof when registerKey is false', async function () {
    const client = confidentialClient({ IssuerEncryptionKey: PUBLIC_KEY })
    const tx = await prepareConfidentialConvert(client, {
      ...base,
      registerKey: false,
    })
    assert.isUndefined(tx.HolderEncryptionKey)
    assert.isUndefined(tx.ZKProof)
  })

  it('auto-omits HolderEncryptionKey/ZKProof when the key is already registered', async function () {
    // Ledger already carries a holder key → a top-up Convert must not re-register
    // it (rippled rejects the duplicate). No explicit registerKey needed.
    const client = confidentialClient(
      { IssuerEncryptionKey: PUBLIC_KEY },
      { HolderEncryptionKey: PUBLIC_KEY },
    )
    const tx = await prepareConfidentialConvert(client, base)
    assert.isUndefined(tx.HolderEncryptionKey)
    assert.isUndefined(tx.ZKProof)
  })

  it('lets an explicit registerKey override the ledger-derived default', async function () {
    // Force registration even though the ledger already has a key.
    const client = confidentialClient(
      { IssuerEncryptionKey: PUBLIC_KEY },
      { HolderEncryptionKey: PUBLIC_KEY },
    )
    const tx = await prepareConfidentialConvert(client, {
      ...base,
      registerKey: true,
    })
    assert.strictEqual(tx.HolderEncryptionKey, PUBLIC_KEY)
    assert.isString(tx.ZKProof)
  })

  it('encrypts to the auditor when an AuditorEncryptionKey is registered', async function () {
    const client = confidentialClient({
      IssuerEncryptionKey: PUBLIC_KEY,
      AuditorEncryptionKey: PUBLIC_KEY,
    })
    const tx = await prepareConfidentialConvert(client, base)
    assert.isString(tx.AuditorEncryptedAmount)
    assert.strictEqual(
      await decryptAmount(
        tx.AuditorEncryptedAmount as string,
        PRIVATE_KEY,
        10_000n,
      ),
      1000n,
    )
  })

  it('throws when the issuer encryption key is not registered', async function () {
    const client = confidentialClient({})
    let error: unknown
    try {
      await prepareConfidentialConvert(client, base)
    } catch (err) {
      error = err
    }
    assert.instanceOf(error, XrplError)
  })

  it('allows a zero amount (holder-key registration)', async function () {
    const client = confidentialClient({ IssuerEncryptionKey: PUBLIC_KEY })
    const tx = await prepareConfidentialConvert(client, { ...base, amount: 0n })
    assert.strictEqual(tx.MPTAmount, '0')
  })

  it('throws when the amount exceeds the MPT maximum', async function () {
    const client = confidentialClient({ IssuerEncryptionKey: PUBLIC_KEY })
    let error: unknown
    try {
      // One past MAX_MPT_AMOUNT (2^63 - 1); the crypto layer would otherwise
      // accept anything up to 2^64 - 1.
      await prepareConfidentialConvert(client, {
        ...base,
        amount: 9223372036854775808n,
      })
    } catch (err) {
      error = err
    }
    assert.instanceOf(error, XrplError)
  })
})
