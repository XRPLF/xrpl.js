import { assert } from 'chai'

import { loadMptCrypto } from '../../src/confidential/loader'

describe('confidential/loader', function () {
  it('loads @xrplf/mpt-crypto and caches the module', async function () {
    const mod = await loadMptCrypto()
    assert.isFunction(mod.encryptAmount)
    assert.isFunction(mod.decryptAmount)
    // second call returns the same cached module instance
    assert.strictEqual(await loadMptCrypto(), mod)
  })
})
