import {
  decryptAmount,
  encryptAmount,
  generateBlindingFactor,
} from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { type Client } from '../../src'
import { prepareConfidentialSend } from '../../src/confidential'

import {
  ADDR_A,
  ADDR_B,
  ISSUANCE_ID,
  KEY_A,
  KEY_B,
  assertRejects,
  assertRejectsXrplError,
  mockClient,
} from './helpers'

/**
 * A client where the sender (ADDR_A) holds `balance` and the destination
 * (ADDR_B) has registered KEY_B; extra issuance fields via `issuanceExtra`.
 *
 * @param balance - The sender's confidential spendable balance to encrypt.
 * @param issuanceExtra - Extra issuance fields (e.g. AuditorEncryptionKey).
 * @param destNode - The destination MPToken node (defaults to a registered key).
 * @returns A mock client serving the issuance + both MPTokens.
 */
async function sendClient(
  balance: bigint,
  issuanceExtra: Record<string, unknown> = {},
  destNode: Record<string, unknown> = { HolderEncryptionKey: KEY_B.publicKey },
): Promise<Client> {
  const spending = await encryptAmount(
    balance,
    KEY_A.publicKey,
    await generateBlindingFactor(),
  )
  return mockClient({
    issuance: { IssuerEncryptionKey: KEY_A.publicKey, ...issuanceExtra },
    mptoken: {
      [ADDR_A]: { ConfidentialBalanceSpending: spending },
      [ADDR_B]: destNode,
    },
  })
}

describe('confidential/prepareConfidentialSend', function () {
  it('encrypts the amount to sender, destination, and issuer', async function () {
    const client = await sendClient(1000n)
    const tx = await prepareConfidentialSend(client, {
      account: ADDR_A,
      destination: ADDR_B,
      amount: 300n,
      senderKeypair: KEY_A,
      mptIssuanceID: ISSUANCE_ID,
      sequence: 5,
    })

    assert.strictEqual(tx.TransactionType, 'ConfidentialMPTSend')
    assert.strictEqual(tx.Account, ADDR_A)
    assert.strictEqual(tx.Destination, ADDR_B)
    assert.lengthOf(tx.AmountCommitment, 66)
    assert.lengthOf(tx.BalanceCommitment, 66)
    // 946-byte send proof
    assert.lengthOf(tx.ZKProof, 1892)
    // each party's ciphertext decrypts to the sent amount with its own key
    assert.strictEqual(
      await decryptAmount(tx.DestinationEncryptedAmount, KEY_B.privateKey),
      300n,
    )
    assert.strictEqual(
      await decryptAmount(tx.SenderEncryptedAmount, KEY_A.privateKey),
      300n,
    )
    assert.strictEqual(
      await decryptAmount(tx.IssuerEncryptedAmount, KEY_A.privateKey),
      300n,
    )
  })

  it('adds the auditor ciphertext and optional fields when provided', async function () {
    const client = await sendClient(1000n, {
      AuditorEncryptionKey: KEY_A.publicKey,
    })
    const tx = await prepareConfidentialSend(client, {
      account: ADDR_A,
      destination: ADDR_B,
      amount: 200n,
      senderKeypair: KEY_A,
      mptIssuanceID: ISSUANCE_ID,
      sequence: 5,
      destinationTag: 42,
      credentialIDs: ['AB'.repeat(32)],
    })
    assert.strictEqual(
      await decryptAmount(
        tx.AuditorEncryptedAmount as string,
        KEY_A.privateKey,
      ),
      200n,
    )
    assert.strictEqual(tx.DestinationTag, 42)
    assert.deepEqual(tx.CredentialIDs, ['AB'.repeat(32)])
  })

  it('throws when the destination has no registered key', async function () {
    const client = await sendClient(1000n, {}, {})
    await assertRejectsXrplError(async () =>
      prepareConfidentialSend(client, {
        account: ADDR_A,
        destination: ADDR_B,
        amount: 100n,
        senderKeypair: KEY_A,
        mptIssuanceID: ISSUANCE_ID,
        sequence: 5,
      }),
    )
  })

  it('throws when the sender has no spendable balance', async function () {
    const client = mockClient({
      issuance: { IssuerEncryptionKey: KEY_A.publicKey },
      mptoken: {
        [ADDR_A]: {},
        [ADDR_B]: { HolderEncryptionKey: KEY_B.publicKey },
      },
    })
    await assertRejectsXrplError(async () =>
      prepareConfidentialSend(client, {
        account: ADDR_A,
        destination: ADDR_B,
        amount: 100n,
        senderKeypair: KEY_A,
        mptIssuanceID: ISSUANCE_ID,
        sequence: 5,
      }),
    )
  })

  it('refuses to send more than the spendable balance (no overdraft)', async function () {
    // The range proof for (balance - amount) can't be built when amount >
    // balance, so the WASM refuses — double-spend is prevented client-side.
    const client = await sendClient(500n)
    await assertRejects(async () =>
      prepareConfidentialSend(client, {
        account: ADDR_A,
        destination: ADDR_B,
        amount: 1000n,
        senderKeypair: KEY_A,
        mptIssuanceID: ISSUANCE_ID,
        sequence: 5,
      }),
    )
  })
})
