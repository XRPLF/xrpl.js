import { encryptAmount, generateBlindingFactor } from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { prepareConfidentialClawback } from '../../src/confidential'

import {
  ADDR_A,
  ADDR_B,
  ISSUANCE_ID,
  KEY_A,
  assertRejectsXrplError,
  mockClient,
} from './helpers'

describe('confidential/prepareConfidentialClawback', function () {
  it('claws back the full balance decrypted from the issuer ciphertext', async function () {
    const issuerBalance = await encryptAmount(
      700n,
      KEY_A.publicKey,
      await generateBlindingFactor(),
    )
    const client = mockClient({
      mptoken: { [ADDR_B]: { IssuerEncryptedBalance: issuerBalance } },
    })
    const tx = await prepareConfidentialClawback(client, {
      account: ADDR_A,
      holder: ADDR_B,
      issuerKeypair: KEY_A,
      mptIssuanceID: ISSUANCE_ID,
      sequence: 5,
    })

    assert.strictEqual(tx.TransactionType, 'ConfidentialMPTClawback')
    assert.strictEqual(tx.Account, ADDR_A)
    assert.strictEqual(tx.Holder, ADDR_B)
    // amount is recovered by decrypting the issuer-encrypted balance
    assert.strictEqual(tx.MPTAmount, '700')
    // 64-byte clawback proof
    assert.lengthOf(tx.ZKProof, 128)
  })

  it('uses an explicit amount without decrypting', async function () {
    const issuerBalance = await encryptAmount(
      700n,
      KEY_A.publicKey,
      await generateBlindingFactor(),
    )
    const client = mockClient({
      mptoken: { [ADDR_B]: { IssuerEncryptedBalance: issuerBalance } },
    })
    const tx = await prepareConfidentialClawback(client, {
      account: ADDR_A,
      holder: ADDR_B,
      issuerKeypair: KEY_A,
      amount: 250n,
      mptIssuanceID: ISSUANCE_ID,
      sequence: 5,
    })
    assert.strictEqual(tx.MPTAmount, '250')
  })

  it('throws when an explicit amount exceeds the MPT maximum', async function () {
    const issuerBalance = await encryptAmount(
      700n,
      KEY_A.publicKey,
      await generateBlindingFactor(),
    )
    const client = mockClient({
      mptoken: { [ADDR_B]: { IssuerEncryptedBalance: issuerBalance } },
    })
    await assertRejectsXrplError(async () =>
      prepareConfidentialClawback(client, {
        account: ADDR_A,
        holder: ADDR_B,
        issuerKeypair: KEY_A,
        // One past MAX_MPT_AMOUNT (2^63 - 1).
        amount: 9223372036854775808n,
        mptIssuanceID: ISSUANCE_ID,
        sequence: 5,
      }),
    )
  })

  it('requires an issuer-encrypted balance unless an override is supplied', async function () {
    // No on-ledger issuer-encrypted balance: a standalone clawback throws.
    const client = mockClient({ mptoken: { [ADDR_B]: {} } })
    await assertRejectsXrplError(async () =>
      prepareConfidentialClawback(client, {
        account: ADDR_A,
        holder: ADDR_B,
        issuerKeypair: KEY_A,
        mptIssuanceID: ISSUANCE_ID,
        sequence: 5,
      }),
    )

    // But prepareConfidentialBatch can pass the balance a prior same-batch inner
    // leaves behind via issuerEncryptedBalanceOverride (e.g. Convert then Clawback in
    // one Batch). It is resolved before the null-check, so the clawback builds against
    // the override even though the on-ledger balance is absent.
    const override = await encryptAmount(
      300n,
      KEY_A.publicKey,
      await generateBlindingFactor(),
    )
    const tx = await prepareConfidentialClawback(client, {
      account: ADDR_A,
      holder: ADDR_B,
      issuerKeypair: KEY_A,
      mptIssuanceID: ISSUANCE_ID,
      sequence: 5,
      issuerEncryptedBalanceOverride: override,
    })
    assert.strictEqual(tx.MPTAmount, '300')
  })
})
