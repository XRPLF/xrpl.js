import { assert } from 'chai'

import { type Batch, type Client, type Wallet } from '../../../src'
import {
  deriveConfidentialKeypair,
  fetchMPToken,
  prepareConfidentialBatch,
  prepareConfidentialConvert,
  prepareConfidentialMergeInbox,
  type ConfidentialKeypair,
} from '../../../src/confidential'
import { type Payment } from '../../../src/models/transactions'
import { signMultiBatch } from '../../../src/Wallet/batchSigner'
import {
  createConfidentialIssuance,
  getSpendable,
  holderWithBalance,
  registerHolderKey,
  setupConfidentialClient,
  setupHolder,
  teardownConfidential,
  type ConfidentialContext,
  type Holder,
} from '../confidentialMPTUtils'
import { generateFundedWallet, ledgerAccept, testTransaction } from '../utils'

const TIMEOUT = 180_000

/**
 * A fresh issuer + confidential issuance, isolating each test.
 *
 * @param client - A connected client.
 * @returns The issuer wallet, its ElGamal key, and the new MPTokenIssuanceID.
 */
async function freshSetup(
  client: Client,
): Promise<{ issuer: Wallet; issuerKey: ConfidentialKeypair; mptID: string }> {
  const issuer = await generateFundedWallet(client)
  const issuerKey = deriveConfidentialKeypair()
  const mptID = await createConfidentialIssuance(client, issuer, issuerKey)
  return { issuer, issuerKey, mptID }
}

/**
 * Build a confidential send operation spec for a batch inner.
 *
 * @param from - The sending holder.
 * @param to - The receiving holder.
 * @param amount - The confidential amount to send.
 * @param mptID - The MPTokenIssuanceID.
 * @returns The `send` operation spec for prepareConfidentialBatch.
 */
// eslint-disable-next-line max-params -- (from, to, amount, token) test tuple
function send(
  from: Holder,
  to: Holder,
  amount: bigint,
  mptID: string,
): {
  operation: 'send'
  account: string
  destination: string
  amount: bigint
  senderKeypair: ConfidentialKeypair
  mptIssuanceID: string
} {
  return {
    operation: 'send',
    account: from.wallet.classicAddress,
    destination: to.wallet.classicAddress,
    amount,
    senderKeypair: from.key,
    mptIssuanceID: mptID,
  }
}

/**
 * Sign + submit an already-assembled (autofilled) confidential Batch: each
 * non-outer participant adds a BatchSigner, the outer account signs, then submit +
 * accept a ledger. Autofill is NOT re-run — the assembler already did it and the
 * inner sequences are proof-bound.
 *
 * @param client - A connected client.
 * @param batch - The assembled Batch from prepareConfidentialBatch.
 * @param outer - The outer Batch account's wallet.
 * @param participants - Wallets of every other account with an inner.
 */
// eslint-disable-next-line max-params -- (client, batch, outer, participants) tuple
async function submitConfidentialBatch(
  client: Client,
  batch: Batch,
  outer: Wallet,
  participants: Wallet[] = [],
): Promise<void> {
  for (const participant of participants) {
    signMultiBatch(participant, batch)
  }
  const signed = outer.sign(batch)
  const response = await client.submit(signed.tx_blob)
  assert.strictEqual(
    response.result.engine_result,
    'tesSUCCESS',
    response.result.engine_result_message,
  )
  await ledgerAccept(client)
}

/**
 * Give an EXISTING holder a spendable balance on a token (authorize, pay public
 * MPT, convert, merge). Unlike holderWithBalance, this reuses a wallet so one
 * account can hold several tokens (needed for the same-account, multi-token combo).
 *
 * @param client - A connected client.
 * @param issuer - The issuer wallet (pays the public MPT).
 * @param holder - The existing holder (wallet + ElGamal key).
 * @param mptID - The MPTokenIssuanceID.
 * @param amount - The balance to establish.
 */
// eslint-disable-next-line max-params -- (client, issuer, holder, token, amount) setup tuple
async function fundHolderOnToken(
  client: Client,
  issuer: Wallet,
  holder: Holder,
  mptID: string,
  amount: bigint,
): Promise<void> {
  await testTransaction(
    client,
    {
      TransactionType: 'MPTokenAuthorize',
      Account: holder.wallet.classicAddress,
      MPTokenIssuanceID: mptID,
    },
    holder.wallet,
  )
  const payment: Payment = {
    TransactionType: 'Payment',
    Account: issuer.classicAddress,
    Destination: holder.wallet.classicAddress,
    Amount: { mpt_issuance_id: mptID, value: amount.toString() },
  }
  await testTransaction(client, payment, issuer)
  await testTransaction(
    client,
    await prepareConfidentialConvert(client, {
      account: holder.wallet.classicAddress,
      amount,
      holderKeypair: holder.key,
      mptIssuanceID: mptID,
    }),
    holder.wallet,
  )
  await testTransaction(
    client,
    await prepareConfidentialMergeInbox(client, {
      account: holder.wallet.classicAddress,
      mptIssuanceID: mptID,
    }),
    holder.wallet,
  )
}

describe('confidential/prepareConfidentialBatch (integration)', function () {
  let context: ConfidentialContext

  beforeAll(async () => {
    context = await setupConfidentialClient()
  }, TIMEOUT)

  afterAll(async () => teardownConfidential(context))

  it(
    'chains two same-account, same-token sends in one atomic Batch',
    async () => {
      const { client } = context
      const setup = await freshSetup(client)
      const alice = await holderWithBalance(
        client,
        setup.issuer,
        setup.mptID,
        100n,
      )
      const bob = await registerHolderKey(client, setup.mptID)
      const carol = await registerHolderKey(client, setup.mptID)

      const batch = await prepareConfidentialBatch(client, {
        account: alice.wallet.classicAddress,
        inners: [
          send(alice, bob, 30n, setup.mptID),
          send(alice, carol, 20n, setup.mptID),
        ],
      })
      await submitConfidentialBatch(client, batch, alice.wallet)

      // Both chained proofs were accepted only if each was built against the
      // balance the previous inner left behind.
      assert.strictEqual(await getSpendable(client, alice, setup.mptID), 50n)
    },
    TIMEOUT,
  )

  it(
    'sends two different tokens from one account in one Batch',
    async () => {
      const { client } = context
      const tokenA = await freshSetup(client)
      const tokenB = await freshSetup(client)
      const alice: Holder = {
        wallet: await generateFundedWallet(client),
        key: deriveConfidentialKeypair(),
      }
      await fundHolderOnToken(client, tokenA.issuer, alice, tokenA.mptID, 100n)
      await fundHolderOnToken(client, tokenB.issuer, alice, tokenB.mptID, 100n)
      const r1 = await registerHolderKey(client, tokenA.mptID)
      const r2 = await registerHolderKey(client, tokenB.mptID)

      const batch = await prepareConfidentialBatch(client, {
        account: alice.wallet.classicAddress,
        inners: [
          send(alice, r1, 30n, tokenA.mptID),
          send(alice, r2, 40n, tokenB.mptID),
        ],
      })
      await submitConfidentialBatch(client, batch, alice.wallet)

      // Same account, independent per-token balances, one shared sequence counter.
      assert.strictEqual(await getSpendable(client, alice, tokenA.mptID), 70n)
      assert.strictEqual(await getSpendable(client, alice, tokenB.mptID), 60n)
    },
    TIMEOUT,
  )

  it(
    'sends the same token from two different accounts (multi-sign)',
    async () => {
      const { client } = context
      const setup = await freshSetup(client)
      const alice = await holderWithBalance(
        client,
        setup.issuer,
        setup.mptID,
        100n,
      )
      const bob = await holderWithBalance(
        client,
        setup.issuer,
        setup.mptID,
        100n,
      )

      const batch = await prepareConfidentialBatch(client, {
        // alice owns the outer Batch
        account: alice.wallet.classicAddress,
        inners: [
          send(alice, bob, 10n, setup.mptID),
          send(bob, alice, 20n, setup.mptID),
        ],
      })
      await submitConfidentialBatch(client, batch, alice.wallet, [bob.wallet])

      // Each spender's spendable dropped by what it sent (receipts land in inbox).
      assert.strictEqual(await getSpendable(client, alice, setup.mptID), 90n)
      assert.strictEqual(await getSpendable(client, bob, setup.mptID), 80n)
    },
    TIMEOUT,
  )

  it(
    'sends two different tokens from two different accounts in one Batch',
    async () => {
      const { client } = context
      const tokenA = await freshSetup(client)
      const tokenB = await freshSetup(client)
      const alice = await holderWithBalance(
        client,
        tokenA.issuer,
        tokenA.mptID,
        100n,
      )
      const carol = await registerHolderKey(client, tokenA.mptID)
      const bob = await holderWithBalance(
        client,
        tokenB.issuer,
        tokenB.mptID,
        100n,
      )
      const dave = await registerHolderKey(client, tokenB.mptID)

      const batch = await prepareConfidentialBatch(client, {
        // alice owns the outer Batch
        account: alice.wallet.classicAddress,
        inners: [
          send(alice, carol, 30n, tokenA.mptID),
          send(bob, dave, 40n, tokenB.mptID),
        ],
      })
      await submitConfidentialBatch(client, batch, alice.wallet, [bob.wallet])

      assert.strictEqual(await getSpendable(client, alice, tokenA.mptID), 70n)
      assert.strictEqual(await getSpendable(client, bob, tokenB.mptID), 60n)
    },
    TIMEOUT,
  )

  it(
    'lets a recipient re-spend funds it received earlier in the same Batch',
    async () => {
      const { client } = context
      const setup = await freshSetup(client)
      const alice = await holderWithBalance(
        client,
        setup.issuer,
        setup.mptID,
        100n,
      )
      // Bob needs an established balance (spending + inbox) for MergeInbox; a small
      // nonzero start (a Payment of 0 MPT is temBAD_AMOUNT).
      const bob = await holderWithBalance(client, setup.issuer, setup.mptID, 5n)
      const carol = await registerHolderKey(client, setup.mptID)

      const batch = await prepareConfidentialBatch(client, {
        account: alice.wallet.classicAddress,
        inners: [
          send(alice, bob, 40n, setup.mptID),
          {
            operation: 'mergeInbox',
            account: bob.wallet.classicAddress,
            mptIssuanceID: setup.mptID,
          },
          send(bob, carol, 15n, setup.mptID),
        ],
      })
      await submitConfidentialBatch(client, batch, alice.wallet, [bob.wallet])

      // Proves the deterministic re-randomized inbox credit is predictable: bob
      // spent 15 from (his 5 + the 40 he received and merged) in the same batch.
      assert.strictEqual(await getSpendable(client, alice, setup.mptID), 60n)
      assert.strictEqual(await getSpendable(client, bob, setup.mptID), 30n)
    },
    TIMEOUT,
  )

  it(
    'claws back a holder immediately after it sends in the same Batch',
    async () => {
      const { client } = context
      const setup = await freshSetup(client)
      const alice = await holderWithBalance(
        client,
        setup.issuer,
        setup.mptID,
        100n,
      )
      const bob = await registerHolderKey(client, setup.mptID)

      const batch = await prepareConfidentialBatch(client, {
        // the issuer owns the outer Batch; alice authorizes her own inner
        account: setup.issuer.classicAddress,
        inners: [
          send(alice, bob, 30n, setup.mptID),
          {
            operation: 'clawback',
            account: setup.issuer.classicAddress,
            holder: alice.wallet.classicAddress,
            issuerKeypair: setup.issuerKey,
            mptIssuanceID: setup.mptID,
          },
        ],
      })
      await submitConfidentialBatch(client, batch, setup.issuer, [alice.wallet])

      // Alice sent 30 (issuer-encrypted balance -> 70), then the issuer clawed back
      // her full remainder: the clawback proof only validates if it bound the
      // predicted post-send issuer-encrypted balance, not the stale on-ledger one.
      assert.strictEqual(await getSpendable(client, alice, setup.mptID), 0n)
    },
    TIMEOUT,
  )

  it(
    'chains a send and a convert-back as two debits on one balance',
    async () => {
      const { client } = context
      const setup = await freshSetup(client)
      const alice = await holderWithBalance(
        client,
        setup.issuer,
        setup.mptID,
        100n,
      )
      const bob = await registerHolderKey(client, setup.mptID)

      const batch = await prepareConfidentialBatch(client, {
        account: alice.wallet.classicAddress,
        inners: [
          send(alice, bob, 30n, setup.mptID),
          {
            operation: 'convertBack',
            account: alice.wallet.classicAddress,
            amount: 20n,
            holderKeypair: alice.key,
            mptIssuanceID: setup.mptID,
          },
        ],
      })
      await submitConfidentialBatch(client, batch, alice.wallet)

      // Send debits spending via SenderEncryptedAmount, convertBack via
      // HolderEncryptedAmount — the convertBack proof only validates if it bound
      // the post-send balance (70), not the stale 100: 100 - 30 - 20 = 50.
      assert.strictEqual(await getSpendable(client, alice, setup.mptID), 50n)
      // convertBack revealed 20 back to the public MPT balance, which was 0 after
      // holderWithBalance converted alice's full 100 into her confidential balance.
      const token = await fetchMPToken(
        client,
        alice.wallet.classicAddress,
        setup.mptID,
      )
      assert.strictEqual(token.MPTAmount, '20')
    },
    TIMEOUT,
  )

  it(
    'mixes a plain XRP Payment with a confidential send in one Batch',
    async () => {
      const { client } = context
      const setup = await freshSetup(client)
      const alice = await holderWithBalance(
        client,
        setup.issuer,
        setup.mptID,
        100n,
      )
      const bob = await registerHolderKey(client, setup.mptID)
      const carol = await generateFundedWallet(client)
      const carolBefore = Number(
        await client.getXrpBalance(carol.classicAddress),
      )

      const batch = await prepareConfidentialBatch(client, {
        account: alice.wallet.classicAddress,
        inners: [
          send(alice, bob, 30n, setup.mptID),
          {
            TransactionType: 'Payment',
            Account: alice.wallet.classicAddress,
            Destination: carol.classicAddress,
            Amount: '1000000',
          },
        ],
      })
      await submitConfidentialBatch(client, batch, alice.wallet)

      // The confidential inner applied (spendable 100 -> 70)...
      assert.strictEqual(await getSpendable(client, alice, setup.mptID), 70n)
      // ...and so did the plain XRP Payment (carol +1 XRP) in the same atomic
      // Batch, proving regular and confidential inners interleave and sequence.
      const carolAfter = Number(
        await client.getXrpBalance(carol.classicAddress),
      )
      assert.strictEqual(carolAfter - carolBefore, 1)
    },
    TIMEOUT,
  )

  it(
    'registers a destination key via Convert and sends to it in the same Batch',
    async () => {
      const { client } = context
      const setup = await freshSetup(client)
      const alice = await holderWithBalance(
        client,
        setup.issuer,
        setup.mptID,
        100n,
      )
      // bob is authorized but has NOT registered his ElGamal key on-ledger yet.
      const bob = await setupHolder(client, setup.mptID)

      const batch = await prepareConfidentialBatch(client, {
        account: alice.wallet.classicAddress,
        inners: [
          // bob registers his key (0-amount Convert)...
          {
            operation: 'convert',
            account: bob.wallet.classicAddress,
            amount: 0n,
            holderKeypair: bob.key,
            mptIssuanceID: setup.mptID,
          },
          // ...and alice sends to bob, whose key is only registered in this Batch.
          send(alice, bob, 30n, setup.mptID),
        ],
      })
      await submitConfidentialBatch(client, batch, alice.wallet, [bob.wallet])

      // The send applied only because it encrypted to bob's key, threaded from the
      // in-batch Convert before it was queryable on-ledger.
      assert.strictEqual(await getSpendable(client, alice, setup.mptID), 70n)
      const bobToken = await fetchMPToken(
        client,
        bob.wallet.classicAddress,
        setup.mptID,
      )
      assert.isString(bobToken.HolderEncryptionKey)
    },
    TIMEOUT,
  )

  it(
    'converts, merges, then spends the topped-up balance in one atomic Batch',
    async () => {
      const { client } = context
      const setup = await freshSetup(client)
      const alice = await holderWithBalance(
        client,
        setup.issuer,
        setup.mptID,
        100n,
      )
      const bob = await registerHolderKey(client, setup.mptID)
      // Fresh public MPT for alice to convert inside the Batch.
      await testTransaction(
        client,
        {
          TransactionType: 'Payment',
          Account: setup.issuer.classicAddress,
          Destination: alice.wallet.classicAddress,
          Amount: { mpt_issuance_id: setup.mptID, value: '100' },
        },
        setup.issuer,
      )

      const batch = await prepareConfidentialBatch(client, {
        account: alice.wallet.classicAddress,
        inners: [
          {
            operation: 'convert',
            account: alice.wallet.classicAddress,
            amount: 100n,
            holderKeypair: alice.key,
            mptIssuanceID: setup.mptID,
          },
          {
            operation: 'mergeInbox',
            account: alice.wallet.classicAddress,
            mptIssuanceID: setup.mptID,
          },
          send(alice, bob, 150n, setup.mptID),
        ],
      })
      await submitConfidentialBatch(client, batch, alice.wallet)

      // Convert (+100) and merge lift alice 100 -> 200, then she sends 150 -> 50.
      // The send's decrypt bound is raised by the in-batch Convert amount, so its
      // predicted balance (200) is recoverable even though the pre-batch outstanding
      // was only 100 — no second holder needed for headroom.
      assert.strictEqual(await getSpendable(client, alice, setup.mptID), 50n)
    },
    TIMEOUT,
  )
})
