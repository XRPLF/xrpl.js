import assert from 'assert-diff'

import {getFaucetUrl} from '../src/wallet/wallet-generation'

describe('Wallet faucet generation', function () {
  it('returns the Devnet URL', function () {
    const onTesnet = false
    const expectedFaucet = 'https://faucet.devnet.rippletest.net/accounts'

    assert.strictEqual(getFaucetUrl(onTesnet), expectedFaucet)
  })

  it('returns the Testnet URL', function () {
    const onTesnet = true
    const expectedFaucet = 'https://faucet.altnet.rippletest.net/accounts'

    assert.strictEqual(getFaucetUrl(onTesnet), expectedFaucet)
  })
})
