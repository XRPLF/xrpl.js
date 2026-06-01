/**
 * `xrpl/confidential` — optional, lazily-loaded integration layer for
 * Confidential MPT (XLS-0096). High-level builders assemble each confidential
 * transaction (querying ledger state, generating shared-blinding ciphertexts,
 * commitments, and ordered zero-knowledge proofs) so callers never hand-build
 * the cryptographic material.
 *
 * The crypto lives in the optional `@xrplf/mpt-crypto` peer dependency, reached
 * only through a dynamic import. Nothing here is exported from `xrpl`'s main
 * entry point, so users who don't need confidential MPT install nothing extra.
 */

export { loadMptCrypto } from './loader'
export type { MptCryptoModule } from './loader'

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

export type {
  ConfidentialClawbackParams,
  ConfidentialConvertBackParams,
  ConfidentialConvertParams,
  ConfidentialKeypair,
  ConfidentialMergeInboxParams,
  ConfidentialSendParams,
} from './types'
