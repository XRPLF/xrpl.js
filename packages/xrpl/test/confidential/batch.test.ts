import { encryptAmount, generateBlindingFactor } from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { type Client } from '../../src'
import { prepareConfidentialBatch } from '../../src/confidential'
import type { SubmittableTransaction } from '../../src/models/transactions'

import {
  ADDR_A,
  ADDR_B,
  ISSUANCE_ID,
  KEY_A,
  KEY_B,
  assertRejects,
  assertRejectsXrplError,
} from './helpers'

// Confidential MPT inners cost ~10x base and each carries a ZK proof; building
// several real proofs per test needs more than the 5s default.
jest.setTimeout(60_000)

const TF_INNER_BATCH_TXN = 0x4000_0000

/** Per-account ledger fixture: encrypted balances + a starting sequence. */
interface AccountFixture {
  spending?: string
  issuerEnc?: string
  inbox?: string
  holderKey?: string
  version?: number
  sequence?: number
}

/**
 * Encrypt `amount` under `publicKey` with fresh randomness.
 *
 * @param amount - The amount to encrypt.
 * @param publicKey - The 33-byte hex ElGamal public key.
 * @returns The 66-byte hex ciphertext.
 */
async function ciphertext(amount: bigint, publicKey: string): Promise<string> {
  return encryptAmount(amount, publicKey, await generateBlindingFactor())
}

/**
 * Build the confidential fields of a ledger MPToken node from a fixture, setting
 * only the fields present.
 *
 * @param fixture - The account's fixture.
 * @returns The MPToken ledger node.
 */
function mptNode(fixture: AccountFixture): Record<string, unknown> {
  const node: Record<string, unknown> = {}
  if (fixture.spending != null) {
    node.ConfidentialBalanceSpending = fixture.spending
  }
  if (fixture.issuerEnc != null) {
    node.IssuerEncryptedBalance = fixture.issuerEnc
  }
  if (fixture.inbox != null) {
    node.ConfidentialBalanceInbox = fixture.inbox
  }
  if (fixture.holderKey != null) {
    node.HolderEncryptionKey = fixture.holderKey
  }
  if (fixture.version != null) {
    node.ConfidentialBalanceVersion = fixture.version
  }
  return node
}

/**
 * A Client stub serving per-account confidential state + sequences, with an
 * identity `autofill` so the assembler's output can be inspected directly (the
 * real outer-fee autofill is exercised by the integration tests).
 *
 * @param accounts - Per-account fixtures keyed by classic address.
 * @returns A Client whose request/autofill serve the fixtures.
 */
function batchClient(accounts: Record<string, AccountFixture>): Client {
  const request = async (req: {
    command?: string
    account?: string
    mpt_issuance?: string
    mptoken?: { account: string }
  }): Promise<unknown> => {
    if (req.command === 'account_info') {
      const seq = accounts[req.account ?? ''].sequence ?? 1
      return { result: { account_data: { Sequence: seq } } }
    }
    if (req.mpt_issuance != null) {
      return {
        result: {
          node: {
            ConfidentialOutstandingAmount: '1000000',
            IssuerEncryptionKey: KEY_A.publicKey,
          },
        },
      }
    }
    if (req.mptoken != null) {
      return { result: { node: mptNode(accounts[req.mptoken.account] ?? {}) } }
    }
    throw new Error(`unexpected request: ${JSON.stringify(req)}`)
  }
  const autofill = async (tx: unknown): Promise<unknown> => tx
  return { request, autofill } as unknown as Client
}

/**
 * A funded sender fixture: spending + issuer-encrypted balance + a sequence.
 *
 * @param balance - The confidential balance to encrypt.
 * @param sequence - The account's current sequence.
 * @returns The account fixture.
 */
async function sender(
  balance: bigint,
  sequence: number,
): Promise<AccountFixture> {
  return {
    spending: await ciphertext(balance, KEY_A.publicKey),
    issuerEnc: await ciphertext(balance, KEY_A.publicKey),
    sequence,
  }
}

/**
 * A destination fixture: a registered holder key + an (empty) inbox.
 *
 * @param publicKey - The destination's 33-byte hex holder key.
 * @returns The account fixture.
 */
async function destination(publicKey: string): Promise<AccountFixture> {
  return { holderKey: publicKey, inbox: await ciphertext(BigInt(0), publicKey) }
}

/**
 * Read the inner transactions out of an assembled Batch.
 *
 * @param batch - The assembled Batch.
 * @param batch.RawTransactions - Its wrapped inner transactions.
 * @returns The inner transactions in order.
 */
function inners(batch: {
  RawTransactions: Array<{ RawTransaction: SubmittableTransaction }>
}): SubmittableTransaction[] {
  return batch.RawTransactions.map((raw) => raw.RawTransaction)
}

describe('confidential/prepareConfidentialBatch', function () {
  it('pins the outer sequence, assigns inner sequences, and shapes inners', async function () {
    const client = batchClient({
      [ADDR_A]: await sender(1000n, 10),
      [ADDR_B]: await destination(KEY_B.publicKey),
    })
    const batch = await prepareConfidentialBatch(client, {
      account: ADDR_A,
      inners: [
        {
          op: 'send',
          account: ADDR_A,
          destination: ADDR_B,
          amount: 30n,
          senderKeypair: KEY_A,
          mptIssuanceID: ISSUANCE_ID,
        },
        {
          TransactionType: 'Payment',
          Account: ADDR_A,
          Destination: ADDR_B,
          Amount: '1000000',
        },
      ],
    })

    assert.strictEqual(batch.TransactionType, 'Batch')
    assert.strictEqual(batch.Account, ADDR_A)
    // The outer Batch consumes the account's current sequence...
    assert.strictEqual(batch.Sequence, 10)
    const [send, pay] = inners(batch)
    // ...so its inners start at current + 1.
    assert.strictEqual(send.Sequence, 11)
    assert.strictEqual(pay.Sequence, 12)
    for (const inner of [send, pay]) {
      assert.strictEqual(inner.Flags, TF_INNER_BATCH_TXN)
      assert.strictEqual(inner.Fee, '0')
    }
    assert.strictEqual(send.TransactionType, 'ConfidentialMPTSend')
    assert.strictEqual(pay.TransactionType, 'Payment')
  })

  it('chains two same-(account,token) sends against the predicted balance', async function () {
    const client = batchClient({
      [ADDR_A]: await sender(50n, 5),
      [ADDR_B]: await destination(KEY_B.publicKey),
    })
    const batch = await prepareConfidentialBatch(client, {
      account: ADDR_A,
      inners: [
        {
          op: 'send',
          account: ADDR_A,
          destination: ADDR_B,
          amount: 30n,
          senderKeypair: KEY_A,
          mptIssuanceID: ISSUANCE_ID,
        },
        {
          op: 'send',
          account: ADDR_A,
          destination: ADDR_B,
          amount: 20n,
          senderKeypair: KEY_A,
          mptIssuanceID: ISSUANCE_ID,
        },
      ],
    })
    // 30 + 20 exactly drains 50: the second proof only builds if it was made
    // against the predicted post-first-send balance (20), not the stale 50.
    assert.lengthOf(batch.RawTransactions, 2)
    const [first, second] = inners(batch)
    assert.strictEqual(first.Sequence, 6)
    assert.strictEqual(second.Sequence, 7)
  })

  it('rejects a chain that overdraws the predicted balance', async function () {
    const client = batchClient({
      [ADDR_A]: await sender(50n, 5),
      [ADDR_B]: await destination(KEY_B.publicKey),
    })
    // 30 then 30: the second send overdraws the predicted 20, so its range proof
    // cannot be built — proving the assembler threads the debit, not the stale balance.
    await assertRejects(async () =>
      prepareConfidentialBatch(client, {
        account: ADDR_A,
        inners: [30n, 30n].map((amount) => ({
          op: 'send',
          account: ADDR_A,
          destination: ADDR_B,
          amount,
          senderKeypair: KEY_A,
          mptIssuanceID: ISSUANCE_ID,
        })),
      }),
    )
  })

  it('assigns each account its own sequence base (outer + 1, others own)', async function () {
    const client = batchClient({
      [ADDR_A]: {
        spending: await ciphertext(1000n, KEY_A.publicKey),
        issuerEnc: await ciphertext(1000n, KEY_A.publicKey),
        inbox: await ciphertext(BigInt(0), KEY_A.publicKey),
        holderKey: KEY_A.publicKey,
        sequence: 10,
      },
      [ADDR_B]: {
        spending: await ciphertext(1000n, KEY_B.publicKey),
        issuerEnc: await ciphertext(1000n, KEY_A.publicKey),
        inbox: await ciphertext(BigInt(0), KEY_B.publicKey),
        holderKey: KEY_B.publicKey,
        sequence: 20,
      },
    })
    const batch = await prepareConfidentialBatch(client, {
      account: ADDR_A,
      inners: [
        {
          op: 'send',
          account: ADDR_A,
          destination: ADDR_B,
          amount: 10n,
          senderKeypair: KEY_A,
          mptIssuanceID: ISSUANCE_ID,
        },
        {
          op: 'send',
          account: ADDR_B,
          destination: ADDR_A,
          amount: 20n,
          senderKeypair: KEY_B,
          mptIssuanceID: ISSUANCE_ID,
        },
      ],
    })
    assert.strictEqual(batch.Sequence, 10)
    const [fromA, fromB] = inners(batch)
    // A owns the outer Batch → its inner starts at current + 1.
    assert.strictEqual(fromA.Sequence, 11)
    // B is only a participant → its inner starts at its own current sequence.
    assert.strictEqual(fromB.Sequence, 20)
  })

  it('throws on an empty inner list', async function () {
    await assertRejectsXrplError(async () =>
      prepareConfidentialBatch(batchClient({}), {
        account: ADDR_A,
        inners: [],
      }),
    )
  })

  it('errors when a chain reads a balance a prior MergeInbox reset', async function () {
    const client = batchClient({
      [ADDR_A]: {
        spending: await ciphertext(100n, KEY_A.publicKey),
        inbox: await ciphertext(50n, KEY_A.publicKey),
        holderKey: KEY_A.publicKey,
        sequence: 5,
      },
    })
    // The first merge consumes the inbox (reset to the uncomputable canonical
    // zero); the second cannot be predicted, so the assembler fails loudly.
    await assertRejectsXrplError(async () =>
      prepareConfidentialBatch(client, {
        account: ADDR_A,
        inners: [ISSUANCE_ID, ISSUANCE_ID].map(() => ({
          op: 'mergeInbox',
          account: ADDR_A,
          mptIssuanceID: ISSUANCE_ID,
        })),
      }),
    )
  })
})
