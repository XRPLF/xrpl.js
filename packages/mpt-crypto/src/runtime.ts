import { Marshaller } from './marshal'
import { loadWasmModule, WasmModule } from './module'

/**
 * Load the (cached) WASM module, run `fn` with a fresh {@link Marshaller}, and
 * release every scratch allocation afterwards. All high-level API functions go
 * through this helper so they never leak WASM heap memory, even on error.
 *
 * @param fn - Callback receiving the loaded module and a bound marshaller.
 * @returns The value returned by `fn`.
 */
// eslint-disable-next-line import/prefer-default-export -- the package's internal execution helper; named for call-site clarity
export async function withModule<T>(
  fn: (mod: WasmModule, marshaller: Marshaller) => T,
): Promise<T> {
  const mod = await loadWasmModule()
  const marshaller = new Marshaller(mod)
  try {
    return fn(mod, marshaller)
  } finally {
    marshaller.dispose()
  }
}
