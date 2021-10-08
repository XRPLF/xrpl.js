import { assert } from 'chai'

import { _private } from '../../src/wallet/fundWallet'
import { setupClient, teardownClient } from '../setupClient'

const { FaucetNetwork, getFaucetUrl } = _private

describe('Get Faucet URL', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('returns the Devnet URL', function () {
    const expectedFaucet = FaucetNetwork.Devnet
    this.client.connection.url = FaucetNetwork.Devnet

    assert.strictEqual(getFaucetUrl(this.client), expectedFaucet)
  })

  it('returns the Testnet URL', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    this.client.connection.url = FaucetNetwork.Testnet

    assert.strictEqual(getFaucetUrl(this.client), expectedFaucet)
  })

  it('returns the Testnet URL with the XRPL Labs server', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    this.client.connection.url = 'wss://testnet.xrpl-labs.com'

    assert.strictEqual(getFaucetUrl(this.client), expectedFaucet)
  })

  it('returns undefined if not a Testnet or Devnet server URL', function () {
    // Info: setupClient.setup creates a connection to 'localhost'
    assert.throws(() => getFaucetUrl(this.client))
  })
})
