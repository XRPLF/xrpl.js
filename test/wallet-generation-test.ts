import assert from 'assert-diff'

import setupAPI from './setup-api'
import {getFaucetUrl, FaucetNetwork} from '../src/wallet/wallet-generation'

describe('Get Faucet URL', function () {
  beforeEach(setupAPI.setup)
  afterEach(setupAPI.teardown)

  it('returns the Devnet URL', function () {
    const expectedFaucet = FaucetNetwork.Devnet
    this.api.connection._url = FaucetNetwork.Devnet

    assert.strictEqual(getFaucetUrl(this.api), expectedFaucet)
  })

  it('returns the Testnet URL', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    this.api.connection._url = FaucetNetwork.Testnet

    assert.strictEqual(getFaucetUrl(this.api), expectedFaucet)
  })

  it('returns the Testnet URL with the XRPL Labs server', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    this.api.connection._url = 'wss://testnet.xrpl-labs.com'

    assert.strictEqual(getFaucetUrl(this.api), expectedFaucet)
  })

  it('returns undefined if not a Testnet or Devnet server URL', function () {
    // Info: setupAPI.setup creates a connection to 'localhost'
    assert.strictEqual(getFaucetUrl(this.api), undefined)
  })
})
