/* eslint-disable max-statements -- necessary for readibility */
import { assert } from 'chai'
import { AMMWithdraw, AMMWithdrawFlags } from 'xrpl'

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

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset: testContext.amm.asset,
      asset2: testContext.amm.asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const {
      amount: preAmount,
      amount2: preAmount2,
      lp_token: preLPToken,
    } = preAmm

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
    const { amount, amount2, lp_token } = amm

    if (typeof amount !== 'string') {
      throw new Error('amount should be a string')
    }
    if (typeof preAmount !== 'string') {
      throw new Error('preAmount should be a string')
    }

    const afterAmountDrops = parseInt(amount, 10)
    const beforeAmountDrops = parseInt(preAmount, 10)
    const diffAmountDrops = -500
    const expectedAmountDrops = beforeAmountDrops + diffAmountDrops

    const afterAmount2 = amount2
    const beforeAmount2 = preAmount2

    const afterLPToken = lp_token
    const beforeLPToken = preLPToken
    const afterLPTokenValue = parseInt(afterLPToken.value, 10)
    const beforeLPTokenValue = parseInt(beforeLPToken.value, 10)
    const diffLPTokenValue = -126
    const expectedLPTokenValue = beforeLPTokenValue + diffLPTokenValue

    assert.equal(afterAmountDrops, expectedAmountDrops)
    assert.deepEqual(afterAmount2, beforeAmount2)
    assert.equal(afterLPTokenValue, expectedLPTokenValue)
  })

  it('withdraw with Amount and Amount2', async function () {
    const { asset, asset2 } = testContext.amm
    const { wallet } = testContext

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
    if (typeof amount2 !== 'object') {
      throw new Error('amount2 should be an object')
    }
    if (typeof preAmount2 !== 'object') {
      throw new Error('preAmount2 should be an object')
    }

    const afterAmountDrops = parseInt(amount, 10)
    const beforeAmountDrops = parseInt(preAmount, 10)
    const diffAmountDrops = -50
    const expectedAmountDrops = beforeAmountDrops + diffAmountDrops

    const afterAmount2 = amount2
    const beforeAmount2 = preAmount2
    const afterAmount2Value = parseInt(afterAmount2.value, 10)
    const beforeAmount2Value = parseInt(beforeAmount2.value, 10)
    const diffAmount2Value = -17
    const expectedAmount2Value = beforeAmount2Value + diffAmount2Value

    const afterLPToken = lp_token
    const beforeLPToken = preLPToken
    const afterLPTokenValue = parseInt(afterLPToken.value, 10)
    const beforeLPTokenValue = parseInt(beforeLPToken.value, 10)
    const diffLPTokenValue = -28
    const expectedLPTokenValue = beforeLPTokenValue + diffLPTokenValue

    assert.equal(afterAmountDrops, expectedAmountDrops)
    assert.equal(afterAmount2Value, expectedAmount2Value)
    assert.equal(afterLPTokenValue, expectedLPTokenValue)
  })

  it('withdraw with Amount and LPTokenIn', async function () {
    const { asset, asset2 } = testContext.amm
    const { wallet } = testContext

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
    if (typeof amount2 !== 'object') {
      throw new Error('amount2 should be an object')
    }
    if (typeof preAmount2 !== 'object') {
      throw new Error('preAmount2 should be an object')
    }

    const afterAmountDrops = parseInt(amount, 10)
    const beforeAmountDrops = parseInt(preAmount, 10)
    const diffAmountDrops = -17
    const expectedAmountDrops = beforeAmountDrops + diffAmountDrops

    const afterAmount2 = amount2
    const beforeAmount2 = preAmount2

    const afterLPToken = lp_token
    const beforeLPToken = preLPToken
    const afterLPTokenValue = parseInt(afterLPToken.value, 10)
    const beforeLPTokenValue = parseInt(beforeLPToken.value, 10)
    const diffLPTokenValue = -5
    const expectedLPTokenValue = beforeLPTokenValue + diffLPTokenValue

    assert.equal(afterAmountDrops, expectedAmountDrops)
    assert.deepEqual(afterAmount2, beforeAmount2)
    assert.equal(afterLPTokenValue, expectedLPTokenValue)
  })

  it('withdraw with LPTokenIn', async function () {
    const { asset, asset2 } = testContext.amm
    const { wallet } = testContext

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
    if (typeof amount2 !== 'object') {
      throw new Error('amount2 should be an object')
    }
    if (typeof preAmount2 !== 'object') {
      throw new Error('preAmount2 should be an object')
    }

    const afterAmountDrops = parseInt(amount, 10)
    const beforeAmountDrops = parseInt(preAmount, 10)
    const diffAmountDrops = -9
    const expectedAmountDrops = beforeAmountDrops + diffAmountDrops

    const afterAmount2 = amount2
    const beforeAmount2 = preAmount2
    const afterAmount2Value = parseInt(afterAmount2.value, 10)
    const beforeAmount2Value = parseInt(beforeAmount2.value, 10)
    const diffAmount2Value = -3
    const expectedAmount2Value = beforeAmount2Value + diffAmount2Value

    const afterLPToken = lp_token
    const beforeLPToken = preLPToken
    const afterLPTokenValue = parseInt(afterLPToken.value, 10)
    const beforeLPTokenValue = parseInt(beforeLPToken.value, 10)
    const diffLPTokenValue = -5
    const expectedLPTokenValue = beforeLPTokenValue + diffLPTokenValue

    assert.equal(afterAmountDrops, expectedAmountDrops)
    assert.equal(afterAmount2Value, expectedAmount2Value)
    assert.equal(afterLPTokenValue, expectedLPTokenValue)
  })
})
