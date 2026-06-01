import { XrplError } from '../errors'

/**
 * The shape of the lazily-loaded `@xrplf/mpt-crypto` module. Resolved from the
 * package's own type declarations so the integration layer stays in sync with
 * the crypto contract without bundling it into `xrpl`'s main entry point.
 */
export type MptCryptoModule = typeof import('@xrplf/mpt-crypto')

let cached: Promise<MptCryptoModule> | undefined

/**
 * Lazily import the optional `@xrplf/mpt-crypto` peer dependency, caching the
 * resolved module so the WASM binary is only loaded once. Confidential MPT
 * operations are the sole consumers of this loader, so users who never touch
 * `xrpl/confidential` never pay the dependency or load cost.
 *
 * @returns The resolved `@xrplf/mpt-crypto` module.
 * @throws {XrplError} If the optional peer dependency is not installed.
 */
export async function loadMptCrypto(): Promise<MptCryptoModule> {
  /* eslint-disable no-inline-comments -- the webpack chunk-name hint must lead the import specifier */
  cached ??= import(
    /* webpackChunkName: "mpt-crypto" */ '@xrplf/mpt-crypto'
  ).catch((error: unknown) => {
    cached = undefined
    throw new XrplError(
      'Confidential MPT operations require the optional "@xrplf/mpt-crypto" ' +
        'package. Install it with `npm install @xrplf/mpt-crypto`.',
      error,
    )
  })
  /* eslint-enable no-inline-comments */
  return cached
}
