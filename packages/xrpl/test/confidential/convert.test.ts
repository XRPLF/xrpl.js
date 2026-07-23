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
 * A Client stub whose `ledger_entry` returns the given MPTokenIssuance node.
 *
 * @param issuanceNode - The issuance fields to return as the ledger node.
 * @returns A Client stub returning `issuanceNode` from `request`.
 */
function issuanceClient(issuanceNode: Record<string, unknown>): Client {
  return {
    request: async () => ({ result: { node: issuanceNode } }),
  } as unknown as Client
}

describe('confidential/prepareConfidentialConvert', function () {
  const holder = { publicKey: PUBLIC_KEY, privateKey: PRIVATE_KEY }
  // `sequence` is pinned so the builder never needs an account_info round-trip.
  const base = {
    account: ADDRESS,
    amount: 1000n,
    holder,
    mptIssuanceID: ISSUANCE_ID,
    sequence: 5,
  }

  it('assembles a Convert whose ciphertext decrypts back to the amount', async function () {
    const client = issuanceClient({ IssuerEncryptionKey: PUBLIC_KEY })
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
    // registerKey defaults to true → key + 64-byte Schnorr proof are attached
    assert.strictEqual(tx.HolderEncryptionKey, PUBLIC_KEY)
    assert.isString(tx.ZKProof)
    assert.lengthOf(tx.ZKProof as string, 128)
    // end-to-end: the holder ciphertext the builder produced decrypts correctly
    assert.strictEqual(
      await decryptAmount(tx.HolderEncryptedAmount, PRIVATE_KEY),
      1000n,
    )
  })

  it('omits HolderEncryptionKey/ZKProof when registerKey is false', async function () {
    const client = issuanceClient({ IssuerEncryptionKey: PUBLIC_KEY })
    const tx = await prepareConfidentialConvert(client, {
      ...base,
      registerKey: false,
    })
    assert.isUndefined(tx.HolderEncryptionKey)
    assert.isUndefined(tx.ZKProof)
  })

  it('encrypts to the auditor when an AuditorEncryptionKey is registered', async function () {
    const client = issuanceClient({
      IssuerEncryptionKey: PUBLIC_KEY,
      AuditorEncryptionKey: PUBLIC_KEY,
    })
    const tx = await prepareConfidentialConvert(client, base)
    assert.isString(tx.AuditorEncryptedAmount)
    assert.strictEqual(
      await decryptAmount(tx.AuditorEncryptedAmount as string, PRIVATE_KEY),
      1000n,
    )
  })

  it('throws when the issuer encryption key is not registered', async function () {
    const client = issuanceClient({})
    let error: unknown
    try {
      await prepareConfidentialConvert(client, base)
    } catch (err) {
      error = err
    }
    assert.instanceOf(error, XrplError)
  })
})
