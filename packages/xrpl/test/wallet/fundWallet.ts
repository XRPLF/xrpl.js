import { assert } from 'chai'

import { _private } from '../../src/Wallet/fundWallet'
import { setupClient, teardownClient } from '../setupClient'

const { FaucetNetwork, getFaucetHost } = _private

describe('Get Faucet host ', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  it('returns the Devnet host', function () {
    const expectedFaucet = FaucetNetwork.Devnet
    this.client.connection.url = FaucetNetwork.Devnet

    assert.strictEqual(getFaucetHost(this.client), expectedFaucet)
  })

  it('returns the Testnet host', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    this.client.connection.url = FaucetNetwork.Testnet

    assert.strictEqual(getFaucetHost(this.client), expectedFaucet)
  })

  it('returns the Testnet host with the XRPL Labs server', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    this.client.connection.url = 'wss://testnet.xrpl-labs.com'

    assert.strictEqual(getFaucetHost(this.client), expectedFaucet)
  })

  it('returns undefined if not a Testnet or Devnet server URL', function () {
    // Info: setupClient.setup creates a connection to 'localhost'
    assert.throws(() => getFaucetHost(this.client))
  })
})
