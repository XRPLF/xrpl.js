# Reviewing xrpl.js

xrpl.js is the canonical **TypeScript SDK for the XRP Ledger** (monorepo: `xrpl`, `ripple-binary-codec`,
`ripple-keypairs`, `ripple-address-codec`, `secret-numbers`, `isomorphic`). It's a **financial primitive** —
amount/serialization/signing bugs corrupt transactions or break consensus compatibility and surface only
against a live network. **rippled (the C++ node) is the protocol source of truth** — verify against it, not
intuition.

## Amounts & numbers
- XRP amounts are **integer strings of drops** (1 XRP = 1e6 drops), never JS `number`. Convert with
  `xrpToDrops`/`dropsToXrp`; XRP→drops floors (`ROUND_FLOOR`); reject any decimal in drops. Drops range 0–1e17.
- Use **bignumber.js** for all amount math; never native `number`, and never introduce a second
  big-number library — the repo deliberately consolidated to one (mixing them causes silent precision drift).
- `Amount` is a union: `string` (XRP drops) | `IssuedCurrencyAmount {value,currency,issuer}` (`MPTAmount`
  is accepted by the `isAmount` guard but not yet in the static `Amount` type — gated on MPTv2). Validate
  amounts with the `isAmount`/`isIssuedCurrencyAmount`/`isMPTAmount` guards, not inline shape checks.
  `"XRP"` is never a valid issued currency (the `isCurrency`/`isIssuedCurrency` guards reject it). IOU
  precision ≤16 significant digits, exponent ∈ [-96, 80]; MPT values are non-negative integer strings.

## Binary serialization (ripple-binary-codec) — silent-failure-prone
- **Round-trip is the core invariant:** `encode(decode(bytes))` must be byte-identical, and
  `Type.from(json).toJSON()` round-trips **canonical** JSON — the codec normalizes non-canonical input
  (e.g. trailing zeros, `123.4000`→`123.4`), so compare after canonicalization.
- Fields come from `enums/definitions.json` (`nth`, `type`, `isVLEncoded`, `isSigningField`) and serialize
  in **ordinal** order, so adding, reordering, or renumbering a field changes the wire format and breaks
  consensus compatibility. It's **generated** from rippled's `server_definitions`
  (`ripple-binary-codec/tools/generateDefinitions.js`) — flag hand-edits, and check new fields/flags against
  rippled, not a draft XLS spec.
- `isSigningField` correctness is **signature-critical**: mis-marking a field silently invalidates
  signatures. `undefined`/omitted fields must not be serialized. Amount serialization drops trailing
  zeros, so the Wallet pre-canonicalizes `Payment.Amount` before signing (`removeTrailingZeros`) so signed
  JSON matches its bytes.
- **Encode/decode must be exact inverses.** A new `SerializedType` subclass' `from()`/`fromParser()` must
  round-trip and be registered (`coreTypes`/`associateTypes`) or it's unreachable. The same holds for
  variable-length (VL) length prefixes — a base or offset differing between encoder and decoder silently
  corrupts every field after it. And keep the parser's bounds checks on any wire-derived length before
  advancing the cursor or slicing (`skip`/`read` reject a negative count or one past the remaining bytes);
  flag a change that drops that guard, not one that relocates it.
- **Intentional, do NOT flag:** the UNLModify `Account`-field omission workaround — it replicates a known
  rippled encoding quirk and must be preserved.

## rippled is the source of truth (defensive client)
- Field names (snake_case), enum values, and optionality mirror rippled's RPC API — not SDK convenience.
- The SDK must **tolerate rippled emitting things it doesn't model**: `BaseResponse.result` and pagination
  `marker`s are typed `unknown`; requests allow extra fields; deprecated fields are retained. Do **not**
  reject, filter, or normalize unknown fields (this is the class of bug behind sibling-SDK failures where
  rippled returned a variant the SDK's model didn't include).
- Response handling: only `status: "success"` proceeds; `"error"` throws `RippledError`. Response types
  are **API-version-aware** (APIv1 vs APIv2 differ structurally) — don't collapse versions.

## Transaction models & validation
- **Adding/modifying a transaction type must update ALL five sites:** (1) the type's interface + `validate`
  fn, (2) its export in `models/transactions/index.ts`, (3) the union in `transaction.ts`, (4) its import
  there, (5) a `case` in the `validate()` switch. TypeScript does **not** enforce switch exhaustiveness, so
  a missing case silently skips validation.
- Flags need three artifacts in the type's file: a `<Type>Flags` enum, a `<Type>FlagsInterface`, **and** an
  entry in `models/utils/flags.ts` `txToFlag` — omitting the last makes valid flag objects fail as "invalid".
- Each `validate<Type>()` must call `validateBaseTransaction()` first. Prefer the
  `validateRequiredField`/`validateOptionalField` helpers for consistent error messages and
  type-narrowing; inline checks exist in the codebase and are acceptable for complex/conditional fields.
- Validate interdependent fields and flag/field dependencies **explicitly, with messages naming both**
  (e.g. `Amount` requires `Amount2`; `DeliverMin` requires `tfPartialPayment`; NFTokenMint `Issuer` ≠
  `Account`). Validate hex fields (`isHex`, non-empty) and array fields via guards (`isMemo`/`isSigner`;
  empty `Memos`/`Signers` are invalid).
- Transaction type codes come from `definitions.json` (`TRANSACTION_TYPES`); never hard-code them — a type
  absent there is unreachable.
- **Intentional, do NOT flag:** pseudo-transactions (`EnableAmendment`/`SetFee`/`UNLModify`) have no
  `validate()` case — they are ledger-created, not user-submitted.

## Cryptography & signing (security-sensitive)
- All randomness via `@xrplf/isomorphic/randomBytes` — never `Math.random`. Seed entropy is exactly 16 bytes.
- **Redact private-key values in error messages** (public keys may be shown).
- Signing is XRPL-specific: SHA-512-half prehash, RFC-6979 deterministic, low-S canonical, DER→uppercase
  hex; ed25519 verifies with `zip215=false`; strip the `"ED"` prefix before crypto ops. Wrong settings
  silently fail on-ledger verification.
- Multisigning: `SigningPubKey=""`, per-signer signatures, `Signers` sorted by numeric account; keep
  single- vs multi-sign encoding paths distinct.
- Batch signing needs a **third encoder**: sign `BatchSigners` with `encodeForSigningBatch` (distinct
  `HashPrefix.batch`), not `encodeForSigning`/`encodeForMultisigning`; the wrong one silently yields an
  invalid on-ledger signature.

## Cross-environment (browser + Node)
- Binary APIs return `Uint8Array`, not `Buffer` (Node-only); use the isomorphic `@noble/*`/`@scure/*`
  packages (not Node-only deps) so code runs in Node and browser.

## Breaking changes & tests
- Public API / model / serialization changes are **breaking**: flag one with no `HISTORY.md` entry;
  user-facing breaks also need a `MIGRATION.md` before/after.
- Tests: **flag an _incorrect_ test** (wrong API, wrong assertion, or masks a real failure); do **not**
  demand missing tests/coverage (unverifiable from a diff) or flag test **style**.

## Test conventions (do NOT flag these idioms)
- **`: any` in `packages/xrpl/test/models/**` is deliberate** — model tests build intentionally
  malformed objects (`let tx: any`, then mutate fields) to drive negative validation; don't flag it
  as loose typing.
- **Model-validation tests use `assertTxValidationError`/`assertTxIsValid`** (which check BOTH the
  type-specific validator AND generic `validate()`). Flag an ad-hoc `assert.throws`/truthiness-only
  assertion here; don't flag the dual-validator pattern.
- **Integration-test idioms (do NOT flag):** retry/resubmit loops on `tefPAST_SEQ`/`tefMAX_LEDGER`/
  `TimeoutError`/`NotConnectedError` (deliberate `no-await-in-loop` disables); the genesis secret
  (`snoPBrX…`) is the public standalone test key, not a leak; and hex-blob string fields
  (`Data`/`URI`/`DIDDocument`/`Domain`/`Memo`, via `convertStringToHex`) aren't malformed.
