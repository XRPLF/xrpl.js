import assert from 'assert'

import _ from 'lodash'
import {
  Client,
  isValidClassicAddress,
  isValidXAddress,
  dropsToXrp,
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

  it('can generate and fund wallets on nft-devnet', async function () {
    const api = new Client('ws://xls20-sandbox.rippletest.net:51233')

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

  it('can generate and fund wallets on hooks v2 testnet', async function () {
    const api = new Client('wss://hooks-testnet-v2.xrpl-labs.com')

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

    // eslint-disable-next-line no-promise-executor-return -- hooks v2 faucet forces 10sec between calls
    await new Promise((ra) => setTimeout(ra, 15000))

    const { balance: newBalance } = await api.fundWallet(wallet, {
      faucetHost: 'hooks-testnet-v2.xrpl-labs.com',
    })

    const afterSent = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })
    assert.equal(dropsToXrp(afterSent.result.account_data.Balance), newBalance)

    await api.disconnect()
  })

  it('can generate and fund wallets on AMM devnet', async function () {
    const api = new Client('wss://amm.devnet.rippletest.net:51233')

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

    await api.disconnect()
  })
})
