/* eslint-disable @typescript-eslint/naming-convention -- WASM exports keep their C names */
/* eslint-disable max-params -- this interface mirrors the C ABI; many byte-pointer args are inherent */

/**
 * Typed view of the Emscripten-generated `mpt_crypto` WASM module. Only the
 * exports vendored by `.github/scripts/build-wasm.sh` are declared. All `uint64_t` parameters
 * are passed as JS `bigint` (the module is built with `-sWASM_BIGINT=1`); all
 * pointer parameters are byte offsets into {@link WasmModule.HEAPU8}.
 *
 * The C `account_id` / `mpt_issuance_id` by-value struct parameters of the
 * context-hash functions are lowered by the wasm32 ABI to pointers, so they are
 * declared as `number` here (verified against the reference harness).
 */
export interface WasmModule {
  HEAPU8: Uint8Array
  _malloc: (size: number) => number
  _free: (ptr: number) => void
  _mpt_secp256k1_context: () => number

  _mpt_generate_blinding_factor: (outFactor: number) => number
  _mpt_encrypt_amount: (
    amount: bigint,
    pubkey: number,
    blinding: number,
    outCiphertext: number,
  ) => number
  _mpt_decrypt_amount: (
    ciphertext: number,
    privkey: number,
    outAmount: number,
    rangeLow: bigint,
    rangeHigh: bigint,
  ) => number
  _mpt_get_pedersen_commitment: (
    amount: bigint,
    blinding: number,
    outCommitment: number,
  ) => number

  _mpt_get_convert_context_hash: (
    account: number,
    issuance: number,
    sequence: number,
    outHash: number,
  ) => number
  _mpt_get_convert_back_context_hash: (
    account: number,
    issuance: number,
    sequence: number,
    version: number,
    outHash: number,
  ) => number
  _mpt_get_send_context_hash: (
    account: number,
    issuance: number,
    sequence: number,
    destination: number,
    version: number,
    outHash: number,
  ) => number
  _mpt_get_clawback_context_hash: (
    account: number,
    issuance: number,
    sequence: number,
    holder: number,
    outHash: number,
  ) => number

  _mpt_get_convert_proof: (
    pubkey: number,
    privkey: number,
    contextHash: number,
    outProof: number,
  ) => number
  _mpt_get_clawback_proof: (
    privkey: number,
    pubkey: number,
    contextHash: number,
    amount: bigint,
    ciphertext: number,
    outProof: number,
  ) => number
  _mpt_get_convert_back_proof: (
    privkey: number,
    pubkey: number,
    contextHash: number,
    amount: bigint,
    params: number,
    outProof: number,
  ) => number
  _mpt_get_confidential_send_proof: (
    privkey: number,
    pubkey: number,
    amount: bigint,
    participants: number,
    nParticipants: number,
    txBlindingFactor: number,
    contextHash: number,
    amountCommitment: number,
    balanceParams: number,
    outProof: number,
    outLen: number,
  ) => number

  // Byte <-> secp256k1_pubkey bridge for homomorphic ciphertext arithmetic.
  // `mpt_make_ec_pair` parses a 66-byte ciphertext (C1 || C2) into two pubkey
  // structs; `mpt_serialize_ec_pair` writes two pubkey structs back to 66 bytes.
  // A `secp256k1_pubkey` is a 64-byte opaque struct. Both return 1 on success.
  _mpt_make_ec_pair: (buffer: number, out1: number, out2: number) => number
  _mpt_serialize_ec_pair: (in1: number, in2: number, out: number) => number

  // Homomorphic ElGamal add/subtract on parsed pubkey pairs (component-wise EC
  // point ops on the two halves). Take the shared secp256k1 context and six
  // pubkey-struct pointers; return 1 on success. See `homomorphic.ts`.
  _secp256k1_elgamal_add: (
    ctx: number,
    sumC1: number,
    sumC2: number,
    aC1: number,
    aC2: number,
    bC1: number,
    bC2: number,
  ) => number
  _secp256k1_elgamal_subtract: (
    ctx: number,
    diffC1: number,
    diffC2: number,
    aC1: number,
    aC2: number,
    bC1: number,
    bC2: number,
  ) => number
}

// eslint-disable-next-line @typescript-eslint/no-type-alias -- the Emscripten module factory's call signature
type WasmFactory = (args?: Record<string, unknown>) => Promise<WasmModule>

let cached: Promise<WasmModule> | undefined

// A load can hit a transient failure (e.g. a browser chunk-fetch hiccup), so it
// is retried a few times, backing off between attempts to give the condition
// time to clear (immediate retries would just hit the same failure).
const MAX_LOAD_ATTEMPTS = 3
const RETRY_BASE_DELAY_MS = 100

/**
 * Import, instantiate, and initialize the WASM module — a single load attempt.
 *
 * @returns The initialized module.
 * @throws If the import/instantiation fails or the secp256k1 context can't init.
 */
async function loadOnce(): Promise<WasmModule> {
  /* eslint-disable no-inline-comments -- the webpack chunk-name hint must lead the import specifier */
  const { default: factory }: { default: WasmFactory } = await import(
    /* webpackChunkName: "mpt-crypto-wasm" */ '@xrplf/mpt-crypto/wasm'
  )
  /* eslint-enable no-inline-comments */
  const instance = await factory()
  // A zero return means the shared secp256k1 context failed to initialize; fail
  // loudly here rather than on the first crypto op.
  if (instance._mpt_secp256k1_context() === 0) {
    throw new Error('mpt-crypto: failed to initialize the secp256k1 context')
  }
  return instance
}

/**
 * Load the module, retrying a transient failure up to {@link MAX_LOAD_ATTEMPTS}.
 *
 * `load` is injectable so the retry/backoff behavior can be unit-tested without a
 * real WASM import; production callers rely on the {@link loadOnce} default.
 *
 * @param load - One load attempt (defaults to {@link loadOnce}).
 * @param attempt - The current (1-based) attempt number.
 * @returns The initialized module.
 * @throws The failure from the final attempt.
 */
export async function loadWithRetry(
  load: () => Promise<WasmModule> = loadOnce,
  attempt = 1,
): Promise<WasmModule> {
  try {
    return await load()
  } catch (error) {
    if (attempt >= MAX_LOAD_ATTEMPTS) {
      throw error
    }
    // Linear backoff (100ms, 200ms, …) so a transient failure has time to clear.
    await new Promise<void>((resolve) => {
      setTimeout(resolve, attempt * RETRY_BASE_DELAY_MS)
    })
    return loadWithRetry(load, attempt + 1)
  }
}

/**
 * Load (once) and return the vendored WASM module.
 *
 * The glue is imported via this package's own `./wasm` subpath export so one line
 * serves both builds: `require`/Jest get the CJS glue, bundlers/browsers the ESM
 * glue (whose `new URL(import.meta.url)` lets them emit the wasm as an asset). See
 * the `package.json` exports and `src/wasm.d.ts`.
 *
 * A transient load failure is retried automatically; if every attempt still
 * fails the rejection is not cached, so a later call retries afresh rather than
 * returning the same permanent rejection.
 *
 * Provenance: `mpt_crypto.{js,mjs,wasm}` come from mpt-crypto's
 * `.github/scripts/build-wasm.sh` and are vendored by `scripts/fetch-wasm.sh`.
 *
 * @returns A promise resolving to the initialized WASM module.
 */
export async function loadWasmModule(): Promise<WasmModule> {
  cached ??= loadWithRetry().catch((error: unknown) => {
    // Don't cache a failed load, so a later call can retry.
    cached = undefined
    throw error
  })
  return cached
}
