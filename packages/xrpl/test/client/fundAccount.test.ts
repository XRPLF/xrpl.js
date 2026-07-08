import { assert } from 'chai'

import addresses from '../fixtures/addresses.json'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'

// how long before each test case times out
const TIMEOUT = 10000

/**
 * These are unit tests for `client.fundAccount` and `client.fundWallet`. They mock out both the
 * rippled WebSocket connection (via `setupClient`/`createMockRippled`) and the faucet HTTP request
 * (via a `fetch` spy), so unlike `test/faucet/fundWallet.test.ts` they don't require network access.
 */
describe('client.fundAccount', function () {
  let testContext: XrplTestContext
  let fetchSpy: jest.SpiedFunction<typeof fetch>

  beforeEach(async () => {
    testContext = await setupClient()
    fetchSpy = jest.spyOn(global, 'fetch')
  })

  afterEach(async () => {
    fetchSpy.mockRestore()
    return teardownClient(testContext)
  })

  /**
   * Queues up a sequence of `account_info` responses (one Balance-in-drops string per call). The
   * last entry is repeated for any calls beyond the length of the array.
   *
   * @param address - The account whose balance is being reported.
   * @param balances - Balances in drops to return, in call order.
   */
  function mockAccountInfoBalances(address: string, balances: string[]): void {
    let callCount = 0
    testContext.mockRippled?.addResponse('account_info', () => {
      const balance = balances[Math.min(callCount, balances.length - 1)]
      callCount += 1
      return {
        status: 'success',
        type: 'response',
        result: {
          account_data: {
            Account: address,
            Balance: balance,
          },
        },
      }
    })
  }

  /**
   * Mocks the faucet HTTP endpoint to always fund whatever `destination` was requested, with the
   * given amount (in whole XRP).
   *
   * @param amount - The XRP amount (not drops) to report as funded.
   */
  function mockFaucetEndpoint(amount: number): void {
    fetchSpy.mockImplementation(async (_input, init) => {
      const body = JSON.parse((init as RequestInit).body as string) as {
        destination: string
      }
      return new Response(
        JSON.stringify({
          account: {
            classicAddress: body.destination,
            xAddress: '',
            secret: '',
          },
          amount,
          balance: amount,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    })
  }

  it(
    'funds an explicit address without needing a Wallet',
    async function () {
      const address = addresses.ACCOUNT
      mockAccountInfoBalances(address, ['0', '100000000'])
      mockFaucetEndpoint(100)

      const result = await testContext.client.fundAccount(address)

      assert.deepEqual(result, { address, balance: 100 })
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      const [url, init] = fetchSpy.mock.calls[0]
      assert.equal(url, 'https://faucet.altnet.rippletest.net/accounts')

      const requestBody = JSON.parse((init as RequestInit).body as string)
      assert.equal(requestBody.destination, address)
      assert.equal(requestBody.userAgent, 'xrpl.js')
    },
    TIMEOUT,
  )

  it(
    'passes a custom amount through to the faucet request',
    async function () {
      const address = addresses.OTHER_ACCOUNT
      mockAccountInfoBalances(address, ['0', '50000000'])
      mockFaucetEndpoint(50)

      const result = await testContext.client.fundAccount(address, {
        amount: '50',
      })

      assert.deepEqual(result, { address, balance: 50 })
      const [, init] = fetchSpy.mock.calls[0]

      const requestBody = JSON.parse((init as RequestInit).body as string)
      assert.equal(requestBody.xrpAmount, '50')
    },
    TIMEOUT,
  )

  it('rejects an invalid classic address without calling the faucet', async function () {
    await expect(
      testContext.client.fundAccount('not-a-real-address'),
    ).rejects.toThrow(/Invalid address/u)
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it(
    'fundWallet still returns a funded Wallet (regression)',
    async function () {
      mockAccountInfoBalances(addresses.THIRD_ACCOUNT, ['100000000'])
      mockFaucetEndpoint(100)

      const { wallet, balance } = await testContext.client.fundWallet()

      assert.equal(balance, 100)
      assert.isDefined(wallet)
      expect(fetchSpy).toHaveBeenCalledTimes(1)

      const [, init] = fetchSpy.mock.calls[0]

      const requestBody = JSON.parse((init as RequestInit).body as string)
      assert.equal(requestBody.destination, wallet.classicAddress)
    },
    TIMEOUT,
  )
})
