# xrpl/confidential

High-level builders for **Confidential MPT (XLS-0096)** — the flow that replaces
a public MPT balance with on-ledger EC-ElGamal ciphertexts and zero-knowledge
proofs, so amounts are hidden from everyone except the parties and (optionally) a
registered auditor.

Each builder queries the ledger state it needs, generates the ciphertexts,
commitments, and the ordered zero-knowledge proof, and returns an **unsigned**
transaction — so you never hand-build cryptographic material. The crypto itself
lives in the [`@xrplf/mpt-crypto`](../../../mpt-crypto) dependency, reached only
through a dynamic `import`, so a bundler code-splits its ~2 MB WASM into a
separate chunk and apps that never assemble a confidential transaction never
load it.

Nothing here is re-exported from `xrpl`'s main entry point; import from the
subpath:

```ts
import {
  deriveConfidentialKeypair,
  prepareConfidentialConvert,
  prepareConfidentialSend,
  // ...
} from 'xrpl/confidential'
```

## Keys

A confidential balance is encrypted under an **ElGamal keypair** (a secp256k1
key: 32-byte hex private scalar, 33-byte hex compressed public key). This is
**distinct from the account's signing key** — derive it with
`deriveConfidentialKeypair()`:

```ts
// No argument: generates a fresh, dedicated secp256k1 key. Persist its
// `privateKey` — it is the only thing that can decrypt the balance.
const holderKey = deriveConfidentialKeypair()
```

If you would rather back up a *seed* than a raw private key, generate a dedicated
seed yourself and re-derive from it — the keypair is deterministic in the seed:

```ts
import { generateSeed } from 'ripple-keypairs'

const seed = generateSeed({ algorithm: 'ecdsa-secp256k1' }) // store this
const holderKey = deriveConfidentialKeypair(seed)
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
} from 'xrpl/confidential'

const client = new Client('wss://...')
await client.connect()

// Assumes `holder1` and `holder2` are funded `Wallet`s and `mptID` is an
// existing MPT issuance created with the confidential-balance flag enabled.

// ElGamal keypairs — distinct from signing keys; persist the private keys.
const holder1Key = deriveConfidentialKeypair()

// 1. Convert 1000 public MPT into holder1's confidential balance.
const convert = await prepareConfidentialConvert(client, {
  account: holder1.classicAddress,
  amount: 1000n,
  holderKeypair: holder1Key,
  mptIssuanceID: mptID,
})
await client.submitAndWait(convert, { wallet: holder1 })

// 2. Send 300 confidentially to holder2.
const send = await prepareConfidentialSend(client, {
  account: holder1.classicAddress,
  destination: holder2.classicAddress,
  amount: 300n,
  senderKeypair: holder1Key,
  mptIssuanceID: mptID,
})
await client.submitAndWait(send, { wallet: holder1 })

// 3. holder2 folds the received amount from its inbox into its spendable balance.
const merge = await prepareConfidentialMergeInbox(client, {
  account: holder2.classicAddress,
  mptIssuanceID: mptID,
})
await client.submitAndWait(merge, { wallet: holder2 })

// Read a confidential balance back (needs the private key to decrypt).
const spendable = await getConfidentialBalance(
  client,
  holder1.classicAddress,
  mptID,
  holder1Key.privateKey,
) // 700n

// ConvertBack (reveal to public) and Clawback (issuer) follow the same
// prepare -> submitAndWait pattern.
```

## Builders

| Builder | Actor | Purpose |
| --- | --- | --- |
| `prepareConfidentialConvert` | holder | Move public MPT into the holder's confidential balance. Registers the holder's encryption key on the first conversion. |
| `prepareConfidentialSend` | holder | Transfer a confidential amount to another holder's inbox, encrypted under sender, destination, issuer, and (if registered) auditor keys. |
| `prepareConfidentialMergeInbox` | holder | Fold pending inbox amounts into the spendable balance. Requires no crypto material. |
| `prepareConfidentialConvertBack` | holder | Reveal a confidential amount back to a public MPT balance. |
| `prepareConfidentialClawback` | issuer | Burn a holder's **entire** confidential balance (all-or-nothing). |

Parameter shapes for each are in [`types.ts`](./types.ts).

## Helpers

- `deriveConfidentialKeypair(seed?)` — derive an ElGamal keypair (see [Keys](#keys)).
- `getConfidentialBalance(client, account, mptIssuanceID, privateKey)` — decrypt
  and return an account's spendable confidential balance.
- `fetchMPToken`, `fetchMPTokenIssuance`, `getAccountSequence`, `accountIdHex` —
  lower-level ledger reads the builders use, exported for advanced callers.
- `loadMptCrypto()` — force-load the WASM module (e.g. to warm the cache before a
  latency-sensitive path); builders call it lazily on their own otherwise.
