import { loadWasmModule, WasmModule, loadWithRetry } from '../src/module'

describe('module', () => {
  describe('loadWasmModule', () => {
    it('loads and initializes the real WASM module', async () => {
      const mod = await loadWasmModule()
      expect(mod._mpt_secp256k1_context()).not.toBe(0)
    })

    it('memoizes: repeated calls return the same instance', async () => {
      expect(await loadWasmModule()).toBe(await loadWasmModule())
    })
  })

  describe('loadWithRetry', () => {
    it('retries a transient failure, then succeeds', async () => {
      // Use the real module as the success sentinel to avoid stubbing WasmModule.
      const real = await loadWasmModule()
      let calls = 0
      const load = async (): Promise<WasmModule> => {
        calls += 1
        if (calls < 3) {
          throw new Error('transient')
        }
        return real
      }
      expect(await loadWithRetry(load)).toBe(real)
      expect(calls).toBe(3)
    })

    it('gives up after the max attempts and rethrows the last error', async () => {
      let calls = 0
      const load = async (): Promise<WasmModule> => {
        calls += 1
        throw new Error(`fail ${calls}`)
      }
      // MAX_LOAD_ATTEMPTS is 3, so the third failure is the one that propagates.
      await expect(loadWithRetry(load)).rejects.toThrow('fail 3')
      expect(calls).toBe(3)
    })
  })
})
