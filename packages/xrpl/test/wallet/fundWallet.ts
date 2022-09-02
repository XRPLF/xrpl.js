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

  it('returns the NFT-Devnet host with the XLS-20 Sandbox server', function () {
    const expectedFaucet = FaucetNetwork.NFTDevnet
    this.client.connection.url = 'ws://xls20-sandbox.rippletest.net:51233'

    assert.strictEqual(getFaucetHost(this.client), expectedFaucet)
  })

  it('returns the Hooks V2 Testnet host', function () {
    const expectedFaucet = FaucetNetwork.HooksV2Testnet
    this.client.connection.url = FaucetNetwork.HooksV2Testnet

    assert.strictEqual(getFaucetHost(this.client), expectedFaucet)
  })

  it('returns undefined if not a Testnet, Devnet, NFT-Devnet, or HooksV2 Testnet server URL', function () {
    // Info: setupClient.setup creates a connection to 'localhost'
    assert.throws(() => getFaucetHost(this.client))
  })
})
