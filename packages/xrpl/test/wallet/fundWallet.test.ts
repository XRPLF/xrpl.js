import { assert } from 'chai'
import type { Client } from 'xrpl-local'

import {
  FaucetNetwork,
  FaucetNetworkPaths,
  getFaucetHost,
  getDefaultFaucetPath,
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

  it('returns the Devnet host', () => {
    const expectedFaucet = FaucetNetwork.Devnet
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = FaucetNetwork.Devnet

    assert.strictEqual(
      getFaucetHost(testContext.client as Client),
      expectedFaucet,
    )
  })

  it('returns the Testnet host', () => {
    const expectedFaucet = FaucetNetwork.Testnet
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = FaucetNetwork.Testnet

    assert.strictEqual(
      getFaucetHost(testContext.client as Client),
      expectedFaucet,
    )
  })

  it('returns the Testnet host with the XRPL Labs server', () => {
    const expectedFaucet = FaucetNetwork.Testnet
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = 'wss://testnet.xrpl-labs.com'

    assert.strictEqual(
      getFaucetHost(testContext.client as Client),
      expectedFaucet,
    )
  })

  it('returns the NFT-Devnet host with the XLS-20 Sandbox server', () => {
    const expectedFaucet = FaucetNetwork.NFTDevnet
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url =
      'ws://xls20-sandbox.rippletest.net:51233'

    assert.strictEqual(
      getFaucetHost(testContext.client as Client),
      expectedFaucet,
    )
  })

  it('returns the Hooks V2 Testnet host', function () {
    const expectedFaucet = FaucetNetwork.HooksV2Testnet
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = FaucetNetwork.HooksV2Testnet

    assert.strictEqual(
      getFaucetHost(testContext.client as Client),
      expectedFaucet,
    )
  })

  it('returns the correct faucetPath for Devnet host', () => {
    const expectedFaucetPath = FaucetNetworkPaths[FaucetNetwork.Devnet]
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = FaucetNetwork.Devnet

    assert.strictEqual(
      getDefaultFaucetPath(getFaucetHost(testContext.client as Client)),
      expectedFaucetPath,
    )
  })

  it('returns the correct faucetPath for Hooks V2 Testnet host', () => {
    const expectedFaucetPath = FaucetNetworkPaths[FaucetNetwork.HooksV2Testnet]
    // @ts-expect-error Intentionally modifying private data for test
    testContext.client.connection.url = FaucetNetwork.HooksV2Testnet

    assert.strictEqual(
      getDefaultFaucetPath(getFaucetHost(testContext.client as Client)),
      expectedFaucetPath,
    )
  })

  it('returns the correct faucetPath for undefined host', () => {
    const expectedFaucetPath = '/accounts'

    assert.strictEqual(getDefaultFaucetPath(undefined), expectedFaucetPath)
  })

  it('throws if not connected to a known faucet host', () => {
    // Info: setupClient.setup creates a connection to 'localhost'
    assert.throws(() => getFaucetHost(testContext.client))
  })
})
