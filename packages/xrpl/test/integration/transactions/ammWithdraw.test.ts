import BigNumber from 'bignumber.js'
import { assert } from 'chai'
import {
  AMMDeposit,
  AMMDepositFlags,
  AMMWithdraw,
  AMMWithdrawFlags,
} from 'xrpl'

import { AMMInfoResponse } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

describe('AMMWithdraw', function () {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => teardownClient(testContext))

  it('withdraw with Amount', async function () {
    const { asset, asset2 } = testContext.amm
    const { wallet } = testContext

    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '1000',
      Flags: AMMDepositFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, wallet)

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset: testContext.amm.asset,
      asset2: testContext.amm.asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const { amount: preAmount, amount2: preAmount2 } = preAmm

    const ammWithdrawTx: AMMWithdraw = {
      TransactionType: 'AMMWithdraw',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '500',
      Flags: AMMWithdrawFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammWithdrawTx, wallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { amount, amount2 } = amm

    if (typeof amount !== 'string') {
      throw new Error('amount should be a string')
    }
    if (typeof preAmount !== 'string') {
      throw new Error('preAmount should be a string')
    }
    assert.equal(parseInt(amount, 10) < parseInt(preAmount, 10), true)
    assert.deepEqual(amount2, preAmount2)
  })

  it('withdraw with Amount and Amount2', async function () {
    const { asset, asset2 } = testContext.amm
    const { wallet } = testContext

    // Need to deposit before withdraw is eligible
    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '1000',
      Flags: AMMDepositFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, wallet)

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const {
      amount: preAmount,
      amount2: preAmount2,
      lp_token: preLPToken,
    } = preAmm

    if (asset2.issuer == null) {
      throw new Error('asset2.issuer should not be null')
    }

    const ammWithdrawTx: AMMWithdraw = {
      TransactionType: 'AMMWithdraw',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '50',
      Amount2: {
        currency: asset2.currency,
        issuer: asset2.issuer,
        value: '50',
      },
      Flags: AMMWithdrawFlags.tfTwoAsset,
    }

    await testTransaction(testContext.client, ammWithdrawTx, wallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { amount, amount2, lp_token } = amm

    if (typeof amount !== 'string') {
      throw new Error('amount should be a string')
    }
    if (typeof preAmount !== 'string') {
      throw new Error('preAmount should be a string')
    }
    assert.equal(parseInt(amount, 10) < parseInt(preAmount, 10), true)

    if (typeof amount2 !== 'object') {
      throw new Error('amount2 should be an object')
    }
    if (typeof preAmount2 !== 'object') {
      throw new Error('preAmount2 should be an object')
    }
    assert.equal(
      parseInt(amount2.value, 10) < parseInt(preAmount2.value, 10),
      true,
    )

    assert.equal(
      parseInt(lp_token.value, 10) < parseInt(preLPToken.value, 10),
      true,
    )
  })

  it('withdraw with Amount and LPTokenIn', async function () {
    const { asset, asset2 } = testContext.amm
    const { wallet } = testContext

    // Need to deposit before withdraw is eligible
    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '1000',
      Flags: AMMDepositFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, wallet)

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const {
      amount: preAmount,
      amount2: preAmount2,
      lp_token: preLPToken,
    } = preAmm

    const lptokenIn = { ...preLPToken, value: '5' }
    const ammWithdrawTx: AMMWithdraw = {
      TransactionType: 'AMMWithdraw',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '5',
      LPTokenIn: lptokenIn,
      Flags: AMMWithdrawFlags.tfOneAssetLPToken,
    }

    await testTransaction(testContext.client, ammWithdrawTx, wallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { amount, amount2, lp_token } = amm

    if (typeof amount !== 'string') {
      throw new Error('amount should be a string')
    }
    if (typeof preAmount !== 'string') {
      throw new Error('preAmount should be a string')
    }
    assert.equal(parseInt(amount, 10) < parseInt(preAmount, 10), true)

    if (typeof amount2 !== 'object') {
      throw new Error('amount2 should be an object')
    }
    if (typeof preAmount2 !== 'object') {
      throw new Error('preAmount2 should be an object')
    }
    assert.deepEqual(amount2, preAmount2)

    assert.equal(
      parseInt(lp_token.value, 10) < parseInt(preLPToken.value, 10),
      true,
    )
  })

  // eslint-disable-next-line max-statements -- Necessary for testing
  it('withdraw with LPTokenIn', async function () {
    const { asset, asset2 } = testContext.amm
    const { wallet } = testContext

    // Need to deposit before withdraw is eligible
    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '1000',
      Flags: AMMDepositFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, wallet)

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const {
      amount: preAmount,
      amount2: preAmount2,
      lp_token: preLPToken,
    } = preAmm

    const lptokenIn = { ...preLPToken, value: '5' }
    const ammWithdrawTx: AMMWithdraw = {
      TransactionType: 'AMMWithdraw',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      LPTokenIn: lptokenIn,
      Flags: AMMWithdrawFlags.tfLPToken,
    }

    await testTransaction(testContext.client, ammWithdrawTx, wallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { amount, amount2, lp_token } = amm

    if (typeof amount !== 'string') {
      throw new Error('amount should be a string')
    }
    if (typeof preAmount !== 'string') {
      throw new Error('preAmount should be a string')
    }
    assert.equal(parseInt(amount, 10) < parseInt(preAmount, 10), true)

    if (typeof amount2 !== 'object') {
      throw new Error('amount2 should be an object')
    }
    if (typeof preAmount2 !== 'object') {
      throw new Error('preAmount2 should be an object')
    }

    const amount2Value = new BigNumber(amount2.value)
    const preAmount2Value = new BigNumber(preAmount2.value)
    assert.equal(amount2Value.isLessThan(preAmount2Value), true)

    assert.equal(
      parseInt(lp_token.value, 10) < parseInt(preLPToken.value, 10),
      true,
    )
  })
})
