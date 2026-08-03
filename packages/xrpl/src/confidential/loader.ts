import { XrplError } from '../errors'

/**
 * The shape of the lazily-loaded `@xrplf/mpt-crypto` module. Resolved from the
 * package's own type declarations so the integration layer stays in sync with
 * the crypto contract without bundling it into `xrpl`'s main entry point.
 */
export type MptCryptoModule = typeof import('@xrplf/mpt-crypto')

let cached: Promise<MptCryptoModule> | undefined

/**
 * Lazily import the `@xrplf/mpt-crypto` dependency, caching the resolved module
 * so the WASM binary is only loaded once. The import is dynamic on purpose:
 * bundlers code-split the ~2 MB WASM into its own chunk, so apps that never
 * touch `xrpl/confidential` never load it even though it ships with `xrpl`.
 *
 * @returns The resolved `@xrplf/mpt-crypto` module.
 * @throws {XrplError} If the module fails to load.
 */
export async function loadMptCrypto(): Promise<MptCryptoModule> {
  /* eslint-disable no-inline-comments -- the webpack chunk-name hint must lead the import specifier */
  cached ??= import(
    /* webpackChunkName: "mpt-crypto" */ '@xrplf/mpt-crypto'
  ).catch((error: unknown) => {
    cached = undefined
    throw new XrplError(
      'Failed to load the "@xrplf/mpt-crypto" module required for Confidential ' +
        'MPT operations.',
      error,
    )
  })
  /* eslint-enable no-inline-comments */
  return cached
}
