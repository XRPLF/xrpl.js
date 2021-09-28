import assert from 'assert'

import _ from 'lodash'

import { Client, isValidClassicAddress, isValidXAddress } from 'xrpl-local'
// how long before each test case times out
const TIMEOUT = 60000
// This test is reliant on external networks, and as such may be flaky.
describe('generateFaucetWallet', function () {
  this.timeout(TIMEOUT)

  it('submit generates a testnet wallet', async function () {
    const api = new Client('wss://s.altnet.rippletest.net:51233')

    await api.connect()
    const wallet = await api.generateFaucetWallet()

    assert.notEqual(wallet, undefined)
    assert(isValidClassicAddress(wallet.classicAddress))
    assert(isValidXAddress(wallet.getXAddress()))

    const info = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })
    assert.equal(info.result.account_data.Balance, '1000000000')

    await api.generateFaucetWallet(wallet)

    const afterSent = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })

    assert.equal(afterSent.result.account_data.Balance, '2000000000')

    await api.disconnect()
  })
  it('submit generates a devnet wallet', async function () {
    const api = new Client('wss://s.devnet.rippletest.net:51233')

    await api.connect()
    const wallet = await api.generateFaucetWallet()

    assert.notEqual(wallet, undefined)
    assert(isValidClassicAddress(wallet.classicAddress))
    assert(isValidXAddress(wallet.getXAddress()))

    const info = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })
    assert.equal(info.result.account_data.Balance, '1000000000')

    await api.generateFaucetWallet(wallet)

    const afterSent = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })
    assert.equal(afterSent.result.account_data.Balance, '2000000000')

    await api.disconnect()
  })
})
