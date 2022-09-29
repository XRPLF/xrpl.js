import { assert } from 'chai'
import { _private } from 'xrpl-local/Wallet/fundWallet'

import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

const { FaucetNetwork, getFaucetHost } = _private

describe('Get Faucet host ', () => {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('returns the Devnet host', () => {
    const expectedFaucet = FaucetNetwork.Devnet
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = FaucetNetwork.Devnet

    assert.strictEqual(getFaucetHost(testContext.client), expectedFaucet)
  })

  it('returns the Testnet host', () => {
    const expectedFaucet = FaucetNetwork.Testnet
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = FaucetNetwork.Testnet

    assert.strictEqual(getFaucetHost(testContext.client), expectedFaucet)
  })

  it('returns the Testnet host with the XRPL Labs server', () => {
    const expectedFaucet = FaucetNetwork.Testnet
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = 'wss://testnet.xrpl-labs.com'

    assert.strictEqual(getFaucetHost(testContext.client), expectedFaucet)
  })

  it('returns undefined if not a Testnet or Devnet server URL', () => {
    // Info: setupClient.setup creates a connection to 'localhost'
    assert.throws(() => getFaucetHost(testContext.client))
  })
})
