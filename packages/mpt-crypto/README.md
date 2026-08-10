# @xrplf/mpt-crypto

Cryptographic primitives for **Confidential MPT (XLS-0096)** on the XRP Ledger,
exposed as a small **hex-in / hex-out** TypeScript API over a vendored
WebAssembly build of the reference C crypto library.

This package ships as a dependency of `xrpl`, but it is **lazily loaded**: the
[`xrpl/confidential`](../xrpl/src/confidential) builders reach it through a
dynamic import, so bundlers code-split its ~2 MB WASM into a separate chunk and
apps that never assemble a Confidential MPT transaction never load it. You
typically interact with those builders rather than calling this package directly.

## What it provides

Confidential MPT replaces a public MPT balance with **EC-ElGamal ciphertexts**
on-ledger and uses **zero-knowledge proofs** so validators can verify transfers
(no overdraft, amounts conserved) without seeing the amounts. This package
exposes the building blocks:

- **Encryption** — `encryptAmount`, `decryptAmount` (EC-ElGamal over secp256k1).
- **Commitments** — `getPedersenCommitment`, `generateBlindingFactor`.
- **Context hashes** — `getConvertContextHash`, `getConvertBackContextHash`,
  `getSendContextHash`, `getClawbackContextHash`. Each binds a proof to a
  specific transaction (account, issuance, sequence, …).
- **Proofs** — `getConvertProof`, `getConvertBackProof`,
  `getConfidentialSendProof`, `getClawbackProof`.
- **Constants** — the fixed byte sizes (`PUBKEY_SIZE`, `ELGAMAL_TOTAL_SIZE`, the
  per-transaction proof sizes, …) and the `bytesToHex` / `hexToBytes` helpers.

## Conventions

- Every byte argument and return value is an **uppercase, even-length hex
  string** with no `0x` prefix (matching the rest of `xrpl.js`).
- Integer amounts are **`bigint`**, to losslessly carry the full `uint64_t`
  range.
- Keys are a **secp256k1 keypair** (32-byte private key, 33-byte compressed
  public key) — the same curve as a secp256k1 signing key, but a distinct key
  used only for encryption. Generate one with `ripple-keypairs`
  (`deriveKeypair(generateSeed({ algorithm: 'ecdsa-secp256k1' }))`).
- The WASM module is loaded once and cached on first use, so depending on this
  package costs nothing until a confidential operation is actually invoked.

## Usage

```ts
import {
  encryptAmount,
  decryptAmount,
  generateBlindingFactor,
} from '@xrplf/mpt-crypto'

const blinding = await generateBlindingFactor()
const ciphertext = await encryptAmount(1000n, publicKey, blinding)
// `rangeHigh` bounds the discrete-log search; decryption recovers any amount in
// [0, rangeHigh]. Pass the tightest correct bound you know (e.g. the issuance's
// outstanding confidential amount) — cost scales with it.
const amount = await decryptAmount(ciphertext, privateKey, 10_000n) // 1000n
```

## The vendored WASM

`wasm/mpt_crypto.{js,mjs,wasm}` is an Emscripten build of the reference
`mpt-crypto` C library ([`XRPLF/mpt-crypto`](https://github.com/XRPLF/mpt-crypto)),
the same library `rippled` links. A single `.wasm` is wrapped by two glues built
from it — `mpt_crypto.js` (CommonJS, for Node / `require`) and `mpt_crypto.mjs`
(ES module, for bundlers / `import`) — so the module loads in every environment.

The exact `mpt-crypto` release these are built from is pinned in
[`MPT_CRYPTO_VERSION`](./MPT_CRYPTO_VERSION). The npm release pipeline downloads
that release's WASM bundle and vendors it into `wasm/` before publishing (via
[`scripts/fetch-wasm.sh`](./scripts/fetch-wasm.sh)), so the published package
always carries the exact WASM for the pinned tag — never fetched at the
consumer's install time.

**The pinned version must stay in lockstep with the `mpt-crypto` version that
`rippled` pins** — a mismatch produces valid-looking transactions that `rippled`
rejects with `tecBAD_PROOF`. To update:

1. Find the version `rippled` pins in its `conanfile.py` (e.g. `mpt-crypto/1.0.2`).
2. Set that tag in [`MPT_CRYPTO_VERSION`](./MPT_CRYPTO_VERSION).
3. Run `npm run fetch:wasm` to vendor the matching WASM locally (the release
   pipeline does the same automatically).

`fetch-wasm.sh` verifies the bundle's `SHA256SUMS` manifest when the release
ships one; integrity of the published npm package is further covered by the npm
package hash.
