import {
  decryptAmount,
  encryptAmount,
  generateBlindingFactor,
} from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { type Client } from '../../src'
import { prepareConfidentialConvertBack } from '../../src/confidential'

import {
  ADDR_A,
  ISSUANCE_ID,
  KEY_A,
  assertRejects,
  assertRejectsXrplError,
  mockClient,
} from './helpers'

/**
 * A client whose issuance + holder MPToken carry a spendable `balance`.
 *
 * @param balance - The holder's confidential spendable balance to encrypt.
 * @param issuanceExtra - Extra issuance fields (e.g. AuditorEncryptionKey).
 * @returns A mock client serving the issuance + holder MPToken.
 */
async function convertBackClient(
  balance: bigint,
  issuanceExtra: Record<string, unknown> = {},
): Promise<Client> {
  const spending = await encryptAmount(
    balance,
    KEY_A.publicKey,
    await generateBlindingFactor(),
  )
  return mockClient({
    issuance: { IssuerEncryptionKey: KEY_A.publicKey, ...issuanceExtra },
    mptoken: { [ADDR_A]: { ConfidentialBalanceSpending: spending } },
  })
}

describe('confidential/prepareConfidentialConvertBack', function () {
  it('reveals a public amount and links the balance witness', async function () {
    const client = await convertBackClient(500n)
    const tx = await prepareConfidentialConvertBack(client, {
      account: ADDR_A,
      amount: 200n,
      holder: KEY_A,
      mptIssuanceID: ISSUANCE_ID,
      sequence: 5,
    })

    assert.strictEqual(tx.TransactionType, 'ConfidentialMPTConvertBack')
    assert.strictEqual(tx.Account, ADDR_A)
    assert.strictEqual(tx.Sequence, 5)
    assert.strictEqual(tx.MPTAmount, '200')
    // 33-byte Pedersen balance commitment; 816-byte convert-back proof
    assert.lengthOf(tx.BalanceCommitment, 66)
    assert.lengthOf(tx.ZKProof, 1632)
    // the revealed-amount ciphertext decrypts back to the amount
    assert.strictEqual(
      await decryptAmount(tx.HolderEncryptedAmount, KEY_A.privateKey),
      200n,
    )
  })

  it('encrypts the revealed amount to the auditor when registered', async function () {
    const client = await convertBackClient(500n, {
      AuditorEncryptionKey: KEY_A.publicKey,
    })
    const tx = await prepareConfidentialConvertBack(client, {
      account: ADDR_A,
      amount: 100n,
      holder: KEY_A,
      mptIssuanceID: ISSUANCE_ID,
      sequence: 5,
    })
    assert.isString(tx.AuditorEncryptedAmount)
    assert.strictEqual(
      await decryptAmount(
        tx.AuditorEncryptedAmount as string,
        KEY_A.privateKey,
      ),
      100n,
    )
  })

  it('throws when the issuer key is not registered', async function () {
    const spending = await encryptAmount(
      500n,
      KEY_A.publicKey,
      await generateBlindingFactor(),
    )
    const client = mockClient({
      issuance: {},
      mptoken: { [ADDR_A]: { ConfidentialBalanceSpending: spending } },
    })
    await assertRejectsXrplError(async () =>
      prepareConfidentialConvertBack(client, {
        account: ADDR_A,
        amount: 100n,
        holder: KEY_A,
        mptIssuanceID: ISSUANCE_ID,
        sequence: 5,
      }),
    )
  })

  it('throws when there is no spendable balance', async function () {
    const client = mockClient({
      issuance: { IssuerEncryptionKey: KEY_A.publicKey },
      mptoken: { [ADDR_A]: {} },
    })
    await assertRejectsXrplError(async () =>
      prepareConfidentialConvertBack(client, {
        account: ADDR_A,
        amount: 100n,
        holder: KEY_A,
        mptIssuanceID: ISSUANCE_ID,
        sequence: 5,
      }),
    )
  })

  it('refuses to reveal more than the balance (no overdraft)', async function () {
    // Revealing more than the balance would need a range proof over a negative
    // remainder; the WASM refuses to build it.
    const client = await convertBackClient(300n)
    await assertRejects(async () =>
      prepareConfidentialConvertBack(client, {
        account: ADDR_A,
        amount: 1000n,
        holder: KEY_A,
        mptIssuanceID: ISSUANCE_ID,
        sequence: 5,
      }),
    )
  })
})
