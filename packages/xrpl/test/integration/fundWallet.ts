import assert from 'assert'

import _ from 'lodash'
import {
  Client,
  isValidClassicAddress,
  isValidXAddress,
  dropsToXrp,
  XRPLFaucetError,
} from 'xrpl-local'
// how long before each test case times out
const TIMEOUT = 60000
// This test is reliant on external networks, and as such may be flaky.
describe('fundWallet', function () {
  this.timeout(TIMEOUT)

  it('submit generates a testnet wallet', async function () {
    const api = new Client('wss://s.altnet.rippletest.net:51233')

    await api.connect()
    const { wallet, balance } = await api.fundWallet()

    assert.notEqual(wallet, undefined)
    assert(isValidClassicAddress(wallet.classicAddress))
    assert(isValidXAddress(wallet.getXAddress()))

    const info = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })
    assert.equal(dropsToXrp(info.result.account_data.Balance), balance)

    const { balance: newBalance } = await api.fundWallet(wallet)

    const afterSent = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })

    assert.equal(dropsToXrp(afterSent.result.account_data.Balance), newBalance)

    await api.disconnect()
  })

  it('submit generates a devnet wallet', async function () {
    const api = new Client('wss://s.devnet.rippletest.net:51233')

    await api.connect()
    const { wallet, balance } = await api.fundWallet()

    assert.notEqual(wallet, undefined)
    assert(isValidClassicAddress(wallet.classicAddress))
    assert(isValidXAddress(wallet.getXAddress()))

    const info = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })

    assert.equal(dropsToXrp(info.result.account_data.Balance), balance)

    const { balance: newBalance } = await api.fundWallet(wallet)

    const afterSent = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })
    assert.equal(dropsToXrp(afterSent.result.account_data.Balance), newBalance)

    await api.disconnect()
  })

  it('can fund an existing Wallet using the Wallet alias', async function () {
    const api = new Client('wss://s.devnet.rippletest.net:51233')

    await api.connect()
    const { wallet, balance } = await api.fundWallet()

    assert.notEqual(wallet, undefined)
    assert(isValidClassicAddress(wallet.classicAddress))
    assert(isValidXAddress(wallet.getXAddress()))

    const info = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })

    assert.equal(dropsToXrp(info.result.account_data.Balance), balance)

    const { balance: newBalance } = await wallet.fundWallet(api)

    const afterSent = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })
    assert.equal(dropsToXrp(afterSent.result.account_data.Balance), newBalance)

    await api.disconnect()
  })
  it('throws when given an incorrectly formatted faucetHost', async function () {
    const api = new Client('ws://xls20-sandbox.rippletest.net:51233')

    let errorHappened = false
    await api.connect()

    // Using try/catch instead of assert.throws because 'await' has to be top-level
    try {
      await api.fundWallet(null, {
        faucetHost: 'https://faucet-nft.ripple.com/',
      })
    } catch (error) {
      assert.ok(error instanceof XRPLFaucetError)
      errorHappened = true
    }

    assert.ok(errorHappened)
    await api.disconnect()
  })

  it('can generate and fund wallets using a custom host', async function () {
    const api = new Client('ws://xls20-sandbox.rippletest.net:51233')

    await api.connect()
    const { wallet, balance } = await api.fundWallet(null, {
      faucetHost: 'faucet-nft.ripple.com',
    })

    assert.notEqual(wallet, undefined)
    assert(isValidClassicAddress(wallet.classicAddress))
    assert(isValidXAddress(wallet.getXAddress()))

    const info = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })

    assert.equal(dropsToXrp(info.result.account_data.Balance), balance)

    const { balance: newBalance } = await api.fundWallet(wallet, {
      faucetHost: 'faucet-nft.ripple.com',
    })

    const afterSent = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })
    assert.equal(dropsToXrp(afterSent.result.account_data.Balance), newBalance)

    await api.disconnect()
  })
})
