import { assert } from 'chai'

import { GlobalTestDataUtils } from './globalTestDataUtils'

describe('globalTestDataUtils', function () {
  it('base', async function () {
    const testData = {
      issuerWalletSeed: 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV',
      lpWalletSeed: 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV',
      testWalletSeed: 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV',
      asset: {
        currency: 'USD',
        issuer: 'shsWGZcmZz6YsWWmcnpfr6fLTdtFV',
      },
      asset2: {
        currency: 'XRP',
      },
    }
    GlobalTestDataUtils.set('ammPool', testData)

    const ammPool = await GlobalTestDataUtils.get('ammPool')

    assert.deepEqual(ammPool, testData)
  })
})
