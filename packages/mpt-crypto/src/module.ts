/* eslint-disable @typescript-eslint/naming-convention -- WASM exports keep their C names */
/* eslint-disable max-params -- this interface mirrors the C ABI; many byte-pointer args are inherent */
/* eslint-disable n/global-require -- runtime-resolved Emscripten glue */
/* eslint-disable @typescript-eslint/no-var-requires -- runtime-resolved Emscripten glue */
/* eslint-disable @typescript-eslint/no-unsafe-assignment -- Emscripten factory typed via ModuleFactory */

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
}

// eslint-disable-next-line @typescript-eslint/no-type-alias -- the Emscripten module factory's call signature
type ModuleFactory = (args?: Record<string, unknown>) => Promise<WasmModule>

let cached: Promise<WasmModule> | undefined

/**
 * Load (once) and return the vendored WASM module. The Emscripten glue locates
 * `mpt_crypto.wasm` next to its own `.js` file, so the vendored `wasm/` folder
 * must ship alongside the compiled output.
 *
 * Provenance: `mpt_crypto.{js,wasm}` are produced by mpt-crypto's
 * `.github/scripts/build-wasm.sh` (an Emscripten build of the pinned secp256k1 +
 * OpenSSL + C sources). The release-artifact + checksum/provenance flow is
 * tracked in `WASM_RELEASE_AND_NPM_PUBLISH.md`.
 *
 * @returns A promise resolving to the initialized WASM module.
 */
export async function loadWasmModule(): Promise<WasmModule> {
  cached ??= (async (): Promise<WasmModule> => {
    const factory: ModuleFactory = require('../wasm/mpt_crypto')
    const instance = await factory()
    // Force one-time initialization of the shared secp256k1 context; a zero
    // return means creation failed — fail loudly rather than on the first op.
    if (instance._mpt_secp256k1_context() === 0) {
      throw new Error('mpt-crypto: failed to initialize the secp256k1 context')
    }
    return instance
  })()
  return cached
}
