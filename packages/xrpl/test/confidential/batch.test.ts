import {
  decryptAmount,
  encryptAmount,
  generateBlindingFactor,
} from '@xrplf/mpt-crypto'
import { assert } from 'chai'

import { type Client } from '../../src'
import {
  type ConfidentialBatchInner,
  prepareConfidentialBatch,
} from '../../src/confidential'
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
// A Payment flag, used to prove a plain inner's own flags are preserved (OR-ed with
// the inner-batch flag), not overwritten, when shaped as a Batch inner.
const TF_PARTIAL_PAYMENT = 0x0002_0000
// A third valid classic address, for the issuer (clawback account / outer Batch).
const ADDR_ISSUER = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'

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
 * @param onAutofill - Optional spy invoked with the signer counts the assembler
 * forwards to `client.autofill`.
 * @returns A Client whose request/autofill serve the fixtures.
 */
function batchClient(
  accounts: Record<string, AccountFixture>,
  onAutofill?: (signersCount?: number, sponsorSignersCount?: number) => void,
): Client {
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
  const autofill = async (
    tx: unknown,
    signersCount?: number,
    sponsorSignersCount?: number,
  ): Promise<unknown> => {
    onAutofill?.(signersCount, sponsorSignersCount)
    return tx
  }
  const getLedgerIndex = async (): Promise<number> => 100
  return { request, autofill, getLedgerIndex } as unknown as Client
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
 * A destination fixture: a registered holder key, an (empty) inbox, and an (empty)
 * issuer-encrypted balance. A real send destination always carries the last one
 * (rippled requires it), and a Send credits it — its issuer mirror — alongside the
 * inbox, so the predictor reads it.
 *
 * @param publicKey - The destination's 33-byte hex holder key.
 * @returns The account fixture.
 */
async function destination(publicKey: string): Promise<AccountFixture> {
  return {
    holderKey: publicKey,
    inbox: await ciphertext(BigInt(0), publicKey),
    issuerEnc: await ciphertext(BigInt(0), KEY_A.publicKey),
  }
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
          operation: 'send',
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
          Flags: TF_PARTIAL_PAYMENT,
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
      assert.strictEqual(inner.Fee, '0')
    }
    // The confidential send carries no other flags; the plain inner's own flag is
    // preserved (OR-ed with the inner-batch flag — disjoint bits, so OR equals the
    // sum), not overwritten.
    assert.strictEqual(send.Flags, TF_INNER_BATCH_TXN)
    assert.strictEqual(pay.Flags, TF_INNER_BATCH_TXN + TF_PARTIAL_PAYMENT)
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
          operation: 'send',
          account: ADDR_A,
          destination: ADDR_B,
          amount: 30n,
          senderKeypair: KEY_A,
          mptIssuanceID: ISSUANCE_ID,
        },
        {
          operation: 'send',
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
          operation: 'send',
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
          operation: 'send',
          account: ADDR_A,
          destination: ADDR_B,
          amount: 10n,
          senderKeypair: KEY_A,
          mptIssuanceID: ISSUANCE_ID,
        },
        {
          operation: 'send',
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
          operation: 'mergeInbox',
          account: ADDR_A,
          mptIssuanceID: ISSUANCE_ID,
        })),
      }),
    )
  })

  it('rejects a Batch with fewer than 2 or more than 8 inners', async function () {
    const payment: SubmittableTransaction = {
      TransactionType: 'Payment',
      Account: ADDR_A,
      Destination: ADDR_B,
      Amount: '1',
    }
    // The bound check runs before any ledger access, so a bare client is enough.
    // Below the minimum of 2 (rippled rejects <= 1)...
    await assertRejectsXrplError(async () =>
      prepareConfidentialBatch(batchClient({}), {
        account: ADDR_A,
        inners: [payment],
      }),
    )
    // ...and above the maximum of 8 (kMaxBatchTxCount).
    await assertRejectsXrplError(async () =>
      prepareConfidentialBatch(batchClient({}), {
        account: ADDR_A,
        inners: Array.from({ length: 9 }, () => payment),
      }),
    )
  })

  it('preserves a plain inner that sets its own Sequence or TicketSequence', async function () {
    const client = batchClient({
      [ADDR_A]: await sender(100n, 10),
      [ADDR_B]: await destination(KEY_B.publicKey),
    })
    const batch = await prepareConfidentialBatch(client, {
      account: ADDR_A,
      inners: [
        {
          operation: 'send',
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
          Amount: '1',
          Sequence: 999,
        },
        {
          TransactionType: 'Payment',
          Account: ADDR_A,
          Destination: ADDR_B,
          Amount: '2',
          TicketSequence: 7,
        },
      ],
    })
    const [send, presetSeq, ticketed] = inners(batch)
    // The confidential send consumes the outer account's current + 1...
    assert.strictEqual(send.Sequence, 11)
    // ...a caller-set Sequence is respected, not overwritten by the counter...
    assert.strictEqual(presetSeq.Sequence, 999)
    // ...and a ticketed inner keeps its ticket with no assigned Sequence.
    assert.strictEqual(ticketed.Sequence, undefined)
    assert.strictEqual(ticketed.TicketSequence, 7)
  })

  it('resolves a destination key registered by an earlier same-batch Convert', async function () {
    const client = batchClient({
      [ADDR_A]: await sender(100n, 5),
      // bob: authorized, but has NOT registered a HolderEncryptionKey on-ledger yet
      [ADDR_B]: {},
    })
    const batch = await prepareConfidentialBatch(client, {
      account: ADDR_A,
      inners: [
        // bob registers his key in this batch...
        {
          operation: 'convert',
          account: ADDR_B,
          amount: 0n,
          holderKeypair: KEY_B,
          mptIssuanceID: ISSUANCE_ID,
        },
        // ...then alice sends 30 to bob in the same batch.
        {
          operation: 'send',
          account: ADDR_A,
          destination: ADDR_B,
          amount: 30n,
          senderKeypair: KEY_A,
          mptIssuanceID: ISSUANCE_ID,
        },
      ],
    })
    // Without the fix this threw "Destination ... has no registered
    // HolderEncryptionKey". Decrypting the destination ciphertext with bob's key
    // recovers the sent amount, proving the send used the key threaded from the
    // Convert rather than the (absent) on-ledger one.
    const [, send] = inners(batch)
    assert.strictEqual(send.TransactionType, 'ConfidentialMPTSend')
    if (send.TransactionType !== 'ConfidentialMPTSend') {
      throw new Error('expected a ConfidentialMPTSend inner')
    }
    const decrypted = await decryptAmount(
      send.DestinationEncryptedAmount,
      KEY_B.privateKey,
      100n,
    )
    assert.strictEqual(decrypted, 30n)
  })

  it('does not re-register the holder key on a second same-(account,token) Convert', async function () {
    const client = batchClient({
      // outer Batch account (signs it; not a Convert party here)
      [ADDR_A]: await sender(100n, 5),
      // holder with no on-ledger key — a first-time Convert
      [ADDR_B]: {},
    })
    const batch = await prepareConfidentialBatch(client, {
      account: ADDR_A,
      inners: [
        {
          operation: 'convert',
          account: ADDR_B,
          amount: 100n,
          holderKeypair: KEY_B,
          mptIssuanceID: ISSUANCE_ID,
        },
        {
          operation: 'convert',
          account: ADDR_B,
          amount: 50n,
          holderKeypair: KEY_B,
          mptIssuanceID: ISSUANCE_ID,
        },
      ],
    })
    // The first Convert registers bob's key; the second must NOT re-register it. The
    // builder auto-detects from on-ledger state, which wouldn't see the first in-batch
    // Convert — so both would emit HolderEncryptionKey and the second fail tecDUPLICATE.
    const [first, second] = inners(batch)
    if (
      first.TransactionType !== 'ConfidentialMPTConvert' ||
      second.TransactionType !== 'ConfidentialMPTConvert'
    ) {
      throw new Error('expected two ConfidentialMPTConvert inners')
    }
    assert.ok(
      first.HolderEncryptionKey != null,
      'first Convert registers the holder key',
    )
    assert.strictEqual(
      second.HolderEncryptionKey,
      undefined,
      'second Convert must not re-register the holder key',
    )
  })

  it('forwards signersCount and sponsorSignersCount to the outer autofill', async function () {
    const accounts = {
      [ADDR_A]: await sender(100n, 5),
      [ADDR_B]: {},
    }
    const innerSpecs: ConfidentialBatchInner[] = [
      {
        operation: 'convert',
        account: ADDR_B,
        amount: 100n,
        holderKeypair: KEY_B,
        mptIssuanceID: ISSUANCE_ID,
      },
      {
        operation: 'convert',
        account: ADDR_B,
        amount: 50n,
        holderKeypair: KEY_B,
        mptIssuanceID: ISSUANCE_ID,
      },
    ]

    // Explicit counts are forwarded verbatim (parity with client.autofill) so the
    // outer fee can cover a multisigned or multi-account Batch's extra signatures.
    let provided: [number?, number?] = [-1, -1]
    await prepareConfidentialBatch(
      batchClient(accounts, (signersCount, sponsorSignersCount) => {
        provided = [signersCount, sponsorSignersCount]
      }),
      {
        account: ADDR_A,
        inners: innerSpecs,
        signersCount: 3,
        sponsorSignersCount: 2,
      },
    )
    assert.deepEqual(provided, [3, 2])

    // Omitted, they forward as undefined so autofill applies its own defaults.
    let omitted: [number?, number?] = [-1, -1]
    await prepareConfidentialBatch(
      batchClient(accounts, (signersCount, sponsorSignersCount) => {
        omitted = [signersCount, sponsorSignersCount]
      }),
      { account: ADDR_A, inners: innerSpecs },
    )
    assert.deepEqual(omitted, [undefined, undefined])
  })

  it('credits the destination issuer balance so a same-batch recipient clawback is predicted', async function () {
    const client = batchClient({
      [ADDR_A]: await sender(100n, 10),
      // bob (recipient): a registered holder key + inbox, and an issuer mirror of 50
      // (the issuer's encrypted view of bob's balance, under the issuer key KEY_A).
      [ADDR_B]: {
        holderKey: KEY_B.publicKey,
        inbox: await ciphertext(BigInt(0), KEY_B.publicKey),
        issuerEnc: await ciphertext(50n, KEY_A.publicKey),
      },
      [ADDR_ISSUER]: { sequence: 20 },
    })
    const batch = await prepareConfidentialBatch(client, {
      account: ADDR_ISSUER,
      inners: [
        {
          operation: 'send',
          account: ADDR_A,
          destination: ADDR_B,
          amount: 30n,
          senderKeypair: KEY_A,
          mptIssuanceID: ISSUANCE_ID,
        },
        {
          operation: 'clawback',
          account: ADDR_ISSUER,
          holder: ADDR_B,
          issuerKeypair: KEY_A,
          mptIssuanceID: ISSUANCE_ID,
        },
      ],
    })
    const [, clawback] = inners(batch)
    assert.strictEqual(clawback.TransactionType, 'ConfidentialMPTClawback')
    if (clawback.TransactionType !== 'ConfidentialMPTClawback') {
      throw new Error('expected a ConfidentialMPTClawback inner')
    }
    // The send credits bob's issuer mirror 50 -> 80; the clawback must reveal that
    // predicted post-send total. Without the mirror credit it would read the stale
    // 50 and rippled would reject the proof (tecBAD_PROOF).
    assert.strictEqual(clawback.MPTAmount, '80')
  })
})
