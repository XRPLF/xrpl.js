/**
 * `xrpl/confidential` — lazily-loaded integration layer for Confidential MPT
 * (XLS-0096). High-level builders assemble each confidential transaction
 * (querying ledger state, generating shared-blinding ciphertexts, commitments,
 * and ordered zero-knowledge proofs) so callers never hand-build the
 * cryptographic material.
 *
 * The crypto lives in the `@xrplf/mpt-crypto` dependency, reached only through a
 * dynamic import so bundlers code-split its WASM. Nothing here is exported from
 * `xrpl`'s main entry point, so apps that don't use confidential MPT never load it.
 */

export { loadMptCrypto } from './loader'
export type { MptCryptoModule } from './loader'

export { deriveConfidentialKeypair } from './keys'

export {
  accountIdHex,
  fetchMPToken,
  fetchMPTokenIssuance,
  getAccountSequence,
  getConfidentialBalance,
} from './ledger'

export {
  prepareConfidentialConvert,
  prepareConfidentialConvertBack,
  prepareConfidentialMergeInbox,
} from './convert'

export {
  prepareConfidentialClawback,
  prepareConfidentialSend,
} from './transfer'

export { prepareConfidentialBatch } from './batch'

export type {
  ConfidentialBatchInner,
  ConfidentialBatchOperation,
  ConfidentialBatchParams,
  ConfidentialClawbackParams,
  ConfidentialConvertBackParams,
  ConfidentialConvertParams,
  ConfidentialKeypair,
  ConfidentialMergeInboxParams,
  ConfidentialSendParams,
  ConfidentialSpendingState,
} from './types'
