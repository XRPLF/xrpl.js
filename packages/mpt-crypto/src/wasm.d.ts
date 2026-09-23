/* eslint-disable import/unambiguous -- ambient module declaration for the glue subpath */
/**
 * Type-only declaration for the `./wasm` subpath export (see `package.json`).
 * Runtime resolution is format-routed by Node/bundlers; this exists only because
 * `moduleResolution: node` doesn't read `exports`, so tsc can't otherwise type it.
 */
declare module '@xrplf/mpt-crypto/wasm' {
  import type { WasmModule } from './module'

  const factory: (args?: Record<string, unknown>) => Promise<WasmModule>
  export default factory
}
