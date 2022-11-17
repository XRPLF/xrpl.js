import assert from 'assert'

import _ from 'lodash'
import {
  Client,
  isValidClassicAddress,
  isValidXAddress,
  dropsToXrp,
  Wallet,
} from 'xrpl-local'

// how long before each test case times out
const TIMEOUT = 60000
let timeOfLastHooksFaucetCall = 0
// This test is reliant on external networks, and as such may be flaky.
describe('fundWallet', function () {
  this.timeout(TIMEOUT)

  /*
   * Purposely separated from other hooks v2 testnet because required
   * 10 seconds between requests
   */
  it('can fund given wallets on hooks v2 testnet', async function () {
    const api = new Client('wss://hooks-testnet-v2.xrpl-labs.com')

    await api.connect()

    const wallet = Wallet.fromSeed('sEd73rvuVo5xFkV7NrzdEDFxuJHKwBe')

    const beforeSent = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })

    const timeSinceLastHooksCall = Date.now() - timeOfLastHooksFaucetCall
    if (timeSinceLastHooksCall < 10000) {
      await new Promise((resolve) => {
        setTimeout(resolve, 11000 - timeSinceLastHooksCall)
      })
    }
    // eslint-disable-next-line require-atomic-updates -- Will not affect timeSinceLastHooksCall
    timeOfLastHooksFaucetCall = Date.now()

    const { balance } = await api.fundWallet(wallet, {
      faucetHost: 'hooks-testnet-v2.xrpl-labs.com',
    })

    const afterSent = await api.request({
      command: 'account_info',
      account: wallet.classicAddress,
    })
    assert(
      dropsToXrp(afterSent.result.account_data.Balance) >
        dropsToXrp(beforeSent.result.account_data.Balance),
    )
    assert(
      balance.toString() > dropsToXrp(beforeSent.result.account_data.Balance),
    )

    await api.disconnect()
  })

  it('submit generates a testnet wallet', async function () {
    await generate_faucet_wallet_and_fund_again(
      'wss://s.altnet.rippletest.net:51233',
    )
  })

  it('submit generates a devnet wallet', async function () {
    await generate_faucet_wallet_and_fund_again(
      'wss://s.devnet.rippletest.net:51233',
    )
  })

  it('can generate and fund wallets on nft-devnet', async function () {
    await generate_faucet_wallet_and_fund_again(
      'ws://xls20-sandbox.rippletest.net:51233',
    )
  })

  it('can generate and fund wallets using a custom host and path', async function () {
    await generate_faucet_wallet_and_fund_again(
      'ws://xls20-sandbox.rippletest.net:51233',
      'faucet-nft.ripple.com',
      '/accounts',
    )
  })

  it('can generate and fund wallets on AMM devnet', async function () {
    await generate_faucet_wallet_and_fund_again(
      'wss://amm.devnet.rippletest.net:51233',
    )
  })

  it('can generate and fund wallet on hooks v2 testnet', async function () {
    const api = new Client('wss://hooks-testnet-v2.xrpl-labs.com')

    await api.connect()

    const timeSinceLastHooksCall = Date.now() - timeOfLastHooksFaucetCall
    if (timeSinceLastHooksCall < 10000) {
      await new Promise((resolve) => {
        setTimeout(resolve, 11000 - timeSinceLastHooksCall)
      })
    }
    // eslint-disable-next-line require-atomic-updates -- Will not affect timeSinceLastHooksCall
    timeOfLastHooksFaucetCall = Date.now()

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
  it('submit funds wallet with custom amount', async function () {
    const api = new Client('wss://s.altnet.rippletest.net:51233')

    await api.connect()
    const { wallet, balance } = await api.fundWallet(null, { amount: '2000' })
    assert.equal(balance, '2000')
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
    faucetHost,
    faucetPath,
  })

  const afterSent = await api.request({
    command: 'account_info',
    account: wallet.classicAddress,
  })
  assert.equal(dropsToXrp(afterSent.result.account_data.Balance), newBalance)

  assert(newBalance > balance)

  await api.disconnect()
}
