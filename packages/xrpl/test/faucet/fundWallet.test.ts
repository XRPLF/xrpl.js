import { assert } from 'chai'

import {
  Client,
  isValidClassicAddress,
  isValidXAddress,
  dropsToXrp,
  XRPLFaucetError,
} from '../../src'

async function generate_faucet_wallet_and_fund_again(
  client: string,
  faucetHost: string | undefined = undefined,
  faucetPath: string | undefined = undefined,
): Promise<void> {
  const api = new Client(client)

  await api.connect()

  const { wallet, balance } = await api.fundWallet(null, {
    faucetHost,
    faucetPath,
    usageContext: 'integration-test',
  })
  assert.notStrictEqual(wallet, undefined)
  assert(isValidClassicAddress(wallet.classicAddress))
  assert(isValidXAddress(wallet.getXAddress()))

  const info = await api.request({
    command: 'account_info',
    account: wallet.classicAddress,
  })

  assert.equal(dropsToXrp(info.result.account_data.Balance), balance)

  const { balance: newBalance } = await api.fundWallet(wallet, {
    faucetHost,
    faucetPath,
    usageContext: 'integration-test',
  })

  const afterSent = await api.request({
    command: 'account_info',
    account: wallet.classicAddress,
  })

  assert(newBalance > balance)
  assert.equal(dropsToXrp(afterSent.result.account_data.Balance), newBalance)

  await api.disconnect()
}

// how long before each test case times out
const TIMEOUT = 60000
// This test is reliant on external networks, and as such may be flaky.
describe('fundWallet', function () {
  it(
    'submit generates a testnet wallet',
    async function () {
      await generate_faucet_wallet_and_fund_again(
        'wss://s.altnet.rippletest.net:51233',
      )
    },
    TIMEOUT,
  )

  it(
    'submit generates a devnet wallet',
    async function () {
      await generate_faucet_wallet_and_fund_again(
        'wss://s.devnet.rippletest.net:51233',
      )
    },
    TIMEOUT,
  )

  // TODO: Investigate why this test is timing out on the browser
  // it('can generate and fund wallets using a custom host and path', async function () {
  //   await generate_faucet_wallet_and_fund_again(
  //     'wss://s.devnet.rippletest.net:51233/',
  //     'faucet.devnet.rippletest.net',
  //     '/accounts',
  //   )
  // })

  it(
    'submit funds wallet with custom amount',
    async function () {
      const api = new Client('wss://s.altnet.rippletest.net:51233')

      await api.connect()
      const { wallet, balance } = await api.fundWallet(null, {
        amount: '100',
        usageContext: 'integration-test',
      })
      assert.equal(balance, 100)
      assert.notStrictEqual(wallet, undefined)
      assert(isValidClassicAddress(wallet.classicAddress))
      assert(isValidXAddress(wallet.getXAddress()))

      const info = await api.request({
        command: 'account_info',
        account: wallet.classicAddress,
      })
      assert.equal(dropsToXrp(info.result.account_data.Balance), balance)
      await api.disconnect()
    },
    TIMEOUT,
  )

  it('handles errors', async () => {
    const api = new Client('wss://s.altnet.rippletest.net:51233')
    await api.connect()

    // jasmine and jest handle async differently so need to use try catch approach instead of `expect.rejects` or `expectAsync`
    try {
      await api.fundWallet(null, {
        amount: '-1000',
        usageContext: 'integration-test',
      })

      throw new Error('Error not thrown')
    } catch (error) {
      await api.disconnect()
      expect(error).toEqual(
        new XRPLFaucetError(
          'Request failed: {"body":{"error":"Invalid amount","detail":"Must be an integer"},"contentType":"application/json; charset=utf-8","statusCode":400}',
        ),
      )
    }
  })
})
