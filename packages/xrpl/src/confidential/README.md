# Confidential MPT

High-level builders for **Confidential MPT (XLS-0096)** — the flow that replaces
a public MPT balance with on-ledger EC-ElGamal ciphertexts and zero-knowledge
proofs, so amounts are hidden from everyone except the parties and (optionally) a
registered auditor.

Each builder queries the ledger state it needs, generates the ciphertexts,
commitments, and the ordered zero-knowledge proof, and returns an **unsigned**
transaction — so you never hand-build cryptographic material. The crypto itself
lives in the [`@xrplf/mpt-crypto`](../../../mpt-crypto) dependency, reached only
through a dynamic `import`, so its ~2 MB WASM loads lazily on the first confidential
transaction you assemble — an app that never assembles one never loads it.

These builders are exported from `xrpl`'s main entry point:

```ts
import {
  deriveConfidentialKeypair,
  prepareConfidentialConvert,
  prepareConfidentialSend,
  // ...
} from 'xrpl'
```

## Keys

A confidential balance is encrypted under an **ElGamal keypair** (a secp256k1
key: 32-byte hex private scalar, 33-byte hex compressed public key), **distinct
from the account's signing key**. Derive one with `deriveConfidentialKeypair()`:

```ts
// No argument: generates a fresh, dedicated secp256k1 key. Persist its
// `privateKey` — it is the only thing that can decrypt the balance.
const aliceKey = deriveConfidentialKeypair()
```

If you would rather back up a *seed* than a raw private key, generate a dedicated
seed yourself and re-derive from it — the keypair is deterministic in the seed:

```ts
import { generateSeed } from 'ripple-keypairs'

const seed = generateSeed({ algorithm: 'ecdsa-secp256k1' }) // store this
const aliceKey = deriveConfidentialKeypair(seed)
```

- **Persist the private key (or the seed).** It is the only thing that can
  decrypt the balance; lose it and the funds become undecryptable (though the
  issuer can still claw them back). It is never sent to the ledger.
- Use a **dedicated** key. Do **not** pass the account's signing seed: it derives
  the same scalar and extends that key's trust boundary to the confidential
  crypto. Both forms above are dedicated; reusing the signing seed is the case to
  avoid.

## Usage

Every builder returns an unsigned transaction with `Sequence` **pinned** — submit
it directly. `submitAndWait` autofills the fee and `LastLedgerSequence` but does
not overwrite an already-set `Sequence`, so the proof stays bound to the sequence
it was built for. Do not re-derive `Sequence` yourself.

```ts
import { Client } from 'xrpl'
import {
  deriveConfidentialKeypair,
  prepareConfidentialConvert,
  prepareConfidentialSend,
  prepareConfidentialMergeInbox,
  getConfidentialBalance,
} from 'xrpl'

const client = new Client('wss://...')
await client.connect()

// Assumes `alice` and `bob` are funded `Wallet`s and `mptIssuanceID` is an
// existing MPT issuance created with the confidential-balance flag enabled.

// ElGamal keypair — distinct from the signing key; persist the private key.
const aliceKey = deriveConfidentialKeypair()

// 1. Convert 1000 public MPT into alice's confidential balance.
const convert = await prepareConfidentialConvert(client, {
  account: alice.classicAddress,
  amount: 1000n,
  holderKeypair: aliceKey,
  mptIssuanceID,
})
await client.submitAndWait(convert, { wallet: alice })

// 2. Send 300 confidentially to bob (who must already have a registered key).
const send = await prepareConfidentialSend(client, {
  account: alice.classicAddress,
  destination: bob.classicAddress,
  amount: 300n,
  senderKeypair: aliceKey,
  mptIssuanceID,
})
await client.submitAndWait(send, { wallet: alice })

// 3. bob folds the amount received in its inbox into its spendable balance.
const merge = await prepareConfidentialMergeInbox(client, {
  account: bob.classicAddress,
  mptIssuanceID,
})
await client.submitAndWait(merge, { wallet: bob })

// Read a confidential balance back (needs the private key to decrypt).
const spendable = await getConfidentialBalance(
  client,
  alice.classicAddress,
  mptIssuanceID,
  aliceKey.privateKey,
) // 700n

// ConvertBack (reveal to public) and Clawback (issuer) follow the same
// prepare -> submitAndWait pattern.
```

## Builders

| Builder | Actor | Purpose |
| --- | --- | --- |
| `prepareConfidentialConvert` | holder | Move public MPT into the holder's confidential balance. Registers the holder's encryption key on the first conversion. |
| `prepareConfidentialSend` | holder | Transfer a confidential amount to another holder's inbox, encrypted under the sender, destination, issuer, and (if registered) auditor keys. |
| `prepareConfidentialMergeInbox` | holder | Fold pending inbox amounts into the spendable balance. Requires no crypto material. |
| `prepareConfidentialConvertBack` | holder | Reveal a confidential amount back to a public MPT balance. |
| `prepareConfidentialClawback` | issuer | Burn a holder's **entire** confidential balance (all-or-nothing). |

Parameter shapes for each are in [`types.ts`](./types.ts).

## Batching

`prepareConfidentialBatch` (the assembler) builds a Batch (XLS-56) whose inner
transactions include Confidential MPT operations, mixed freely with plain
transactions. It exists because a confidential proof binds the transaction's
**`Sequence`** — and, for `send`/`convertBack`, the live
`ConfidentialBalanceSpending` + `ConfidentialBalanceVersion` — at build time.
Inside a Batch each inner's sequence is position-dependent, so the proof must be
built with the final value (`autofill` can't re-derive a proof afterward); and
when several balance-mutating operations for the same `(account, token)` share one
Batch, each proof must bind the balance the previous one leaves behind. The
assembler owns all of that.

Pass the outer Batch account and an ordered list of inners — each either a
confidential operation spec (the matching builder's params minus `sequence`, plus an
`operation` tag) or a pre-built plain transaction. Array order is on-ledger execution order.

```ts
import { prepareConfidentialBatch } from 'xrpl'

// Atomic multi-send: alice pays two recipients confidentially in one Batch.
const batch = await prepareConfidentialBatch(client, {
  account: alice.classicAddress,
  inners: [
    { operation: 'send', account: alice.classicAddress, destination: bob.classicAddress, amount: 100n, senderKeypair: aliceKey, mptIssuanceID },
    { operation: 'send', account: alice.classicAddress, destination: carol.classicAddress, amount: 50n, senderKeypair: aliceKey, mptIssuanceID },
  ],
})
const { tx_blob } = alice.sign(batch)
await client.submit(tx_blob)
```

Inners mix confidential operations with plain transactions freely: a confidential
operation spec is a *recipe* (`operation`-tagged, camelCase — it mirrors the builder's
params), while a
plain transaction is the normal wire model (`TransactionType`, PascalCase). The
assembler builds and proves the operation specs and shapes the plain ones as Batch inners:

```ts
const batch = await prepareConfidentialBatch(client, {
  account: alice.classicAddress,
  inners: [
    // a confidential operation spec — the assembler builds the tx + proof from it
    { operation: 'send', account: alice.classicAddress, destination: bob.classicAddress, amount: 100n, senderKeypair: aliceKey, mptIssuanceID },
    // a plain transaction — shaped as a Batch inner and passed through
    { TransactionType: 'Payment', Account: alice.classicAddress, Destination: carol.classicAddress, Amount: '1000000' },
  ],
})
const { tx_blob } = alice.sign(batch)
await client.submit(tx_blob)
```

Operation types are `send`, `convert`, `convertBack`, `mergeInbox`, and `clawback` — the
same actors as the [Builders](#builders) above.

The assembler returns a **fully-assembled, autofilled Batch — sign and submit it
as-is.** Its inner sequences are pinned to the values the proofs bind, so don't
overwrite or re-derive them (a second `client.autofill` is harmless — it preserves
already-set sequences — but there's no reason to call it). **Signing stays with
you:** when inners span several accounts, each non-outer account calls
`signMultiBatch` (combine two or more with `combineBatchSigners`), then the outer
account signs and submits:

```ts
import { signMultiBatch } from 'xrpl'

const batch = await prepareConfidentialBatch(client, {
  account: alice.classicAddress, // owns + signs the outer Batch
  inners: [
    { operation: 'send', account: alice.classicAddress, destination: carol.classicAddress, amount: 10n, senderKeypair: aliceKey, mptIssuanceID },
    { operation: 'send', account: bob.classicAddress, destination: carol.classicAddress, amount: 20n, senderKeypair: bobKey, mptIssuanceID },
  ],
})
signMultiBatch(bob, batch) // each non-outer participant authorizes its inner
const { tx_blob } = alice.sign(batch)
await client.submit(tx_blob)
```

The assembler handles every account/token combination uniformly — assigning each
account its position-derived inner sequences (mirroring `autofill`), threading
predicted balance state through repeated same-`(account, token)` operations,
shaping each inner (`tfInnerBatchTxn`, `Fee: '0'`), and autofilling the outer fee.

## Helpers

- `deriveConfidentialKeypair(seed?)` — derive an ElGamal keypair (see [Keys](#keys)).
- `getConfidentialBalance(client, account, mptIssuanceID, privateKey)` — decrypt
  and return an account's spendable confidential balance.
- `fetchMPToken`, `fetchMPTokenIssuance`, `getAccountSequence`, `accountIdHex` —
  lower-level ledger reads the builders use, exported for advanced callers.
- `loadMptCrypto()` — force-load the WASM module (e.g. to warm the cache before a
  latency-sensitive path); builders call it lazily on their own otherwise.
