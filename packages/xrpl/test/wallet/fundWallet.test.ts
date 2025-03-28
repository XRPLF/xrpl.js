import { assert } from 'chai'

import {
  FaucetNetwork,
  FaucetNetworkPaths,
  getFaucetHost,
  getFaucetPath,
} from '../../src/Wallet/defaultFaucets'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

describe('Get Faucet host ', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('returns the Devnet host', function () {
    const expectedFaucet = FaucetNetwork.Devnet
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = FaucetNetwork.Devnet

    assert.strictEqual(getFaucetHost(testContext.client), expectedFaucet)
  })

  it('returns the Testnet host', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = FaucetNetwork.Testnet

    assert.strictEqual(getFaucetHost(testContext.client), expectedFaucet)
  })

  it('returns the Testnet host with the XRPL Labs server', function () {
    const expectedFaucet = FaucetNetwork.Testnet
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = 'wss://testnet.xrpl-labs.com'

    assert.strictEqual(getFaucetHost(testContext.client), expectedFaucet)
  })

  it('returns the correct faucetPath for Devnet host', function () {
    const expectedFaucetPath = FaucetNetworkPaths[FaucetNetwork.Devnet]
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = FaucetNetwork.Devnet

    assert.strictEqual(
      getFaucetPath(getFaucetHost(testContext.client)),
      expectedFaucetPath,
    )
  })

  it('returns the correct faucetPath for undefined host', function () {
    const expectedFaucetPath = '/accounts'

    assert.strictEqual(getFaucetPath(undefined), expectedFaucetPath)
  })

  it('throws if not connected to a known faucet host', function () {
    // Info: setupClient.setup creates a connection to 'localhost'
    assert.throws(() => getFaucetHost(testContext.client))
  })
})
