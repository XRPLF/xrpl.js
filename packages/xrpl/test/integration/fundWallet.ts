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
})
