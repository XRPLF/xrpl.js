# @xrplf/mpt-crypto

Cryptographic primitives for **Confidential MPT (XLS-0096)** on the XRP Ledger,
exposed as a small **hex-in / hex-out** TypeScript API over a vendored
WebAssembly build of the reference C crypto library.

This package is an **optional peer dependency** of `xrpl`. Most `xrpl` users
never need it — it is only required (and lazily loaded) by the
[`xrpl/confidential`](../xrpl/src/confidential) builders, which assemble
Confidential MPT transactions. You typically interact with those builders rather
than calling this package directly.

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
const amount = await decryptAmount(ciphertext, privateKey) // 1000n
```

## The vendored WASM

`wasm/mpt_crypto.{js,wasm}` is a committed Emscripten build of the reference
`mpt-crypto` C library ([`XRPLF/mpt-crypto`](https://github.com/XRPLF/mpt-crypto)),
the same library `rippled` links. It is produced by that repo's `build_emcc.sh`
(`emcc`, statically bundling secp256k1 + a stripped OpenSSL), which emits
`emcc_out/mpt_crypto.{js,wasm}`; both files are copied here verbatim.

**It must stay in lockstep with the `mpt-crypto` version that `rippled` pins** — a
mismatch produces valid-looking transactions that `rippled` rejects with
`tecBAD_PROOF`. To update:

1. Find the pinned version in rippled's `conanfile.py` (e.g. `mpt-crypto/0.4.0-rc4`).
2. In `XRPLF/mpt-crypto`, check out that tag and run `./build_emcc.sh`.
3. Copy `emcc_out/mpt_crypto.{js,wasm}` into `wasm/` here.

The build is deterministic from the tagged source, so provenance is verified by
reproducing it; distribution integrity is provided by the npm package hash rather
than an in-package checksum (which would ship alongside — and be replaceable with —
the binary it claims to verify).
