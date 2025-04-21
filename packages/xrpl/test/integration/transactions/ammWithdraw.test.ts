/* eslint-disable max-statements -- necessary for readibility */
import { assert } from 'chai'
import { AMMWithdraw, AMMWithdrawFlags } from 'xrpl'

import { AMMInfoResponse } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupAMMPool,
  setupClient,
  teardownClient,
  type TestAMMPool,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

describe('AMMWithdraw', function () {
  let testContext: XrplIntegrationTestContext
  let ammPool: TestAMMPool

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    ammPool = await setupAMMPool(testContext.client)
  })
  afterAll(async () => teardownClient(testContext))

  it('withdraw with Amount', async function () {
    const { asset, asset2, testWallet } = ammPool

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

    const ammWithdrawTx: AMMWithdraw = {
      TransactionType: 'AMMWithdraw',
      Account: testWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '500',
      Flags: AMMWithdrawFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammWithdrawTx, testWallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { amount, amount2, lp_token } = amm

    expect(typeof amount).toBe('string')
    expect(typeof preAmount).toBe('string')

    // @ts-expect-error: amount should be a string
    const afterAmountDrops = parseInt(amount, 10)
    // @ts-expect-error: preAmount should be a string
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
    const { asset, asset2, testWallet } = ammPool

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

    assert.ok(asset2.issuer)

    const ammWithdrawTx: AMMWithdraw = {
      TransactionType: 'AMMWithdraw',
      Account: testWallet.classicAddress,
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

    await testTransaction(testContext.client, ammWithdrawTx, testWallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { amount, amount2, lp_token } = amm

    expect(typeof amount).toBe('string')
    expect(typeof preAmount).toBe('string')
    expect(typeof amount2).toBe('object')
    expect(typeof preAmount2).toBe('object')

    // @ts-expect-error: amount should be a string
    const afterAmountDrops = parseInt(amount, 10)
    // @ts-expect-error: preAmount should be a string
    const beforeAmountDrops = parseInt(preAmount, 10)
    const diffAmountDrops = -50
    const expectedAmountDrops = beforeAmountDrops + diffAmountDrops

    const afterAmount2 = amount2
    const beforeAmount2 = preAmount2
    // @ts-expect-error: afterAmount2 should be an object
    const afterAmount2Value = parseInt(afterAmount2.value, 10)
    // @ts-expect-error: beforeAmount2 should be an object
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
    const { asset, asset2, testWallet } = ammPool

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
      Account: testWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '5',
      LPTokenIn: lptokenIn,
      Flags: AMMWithdrawFlags.tfOneAssetLPToken,
    }

    await testTransaction(testContext.client, ammWithdrawTx, testWallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { amount, amount2, lp_token } = amm

    expect(typeof amount).toBe('string')
    expect(typeof preAmount).toBe('string')
    expect(typeof amount2).toBe('object')
    expect(typeof preAmount2).toBe('object')

    // @ts-expect-error: amount should be a string
    const afterAmountDrops = parseInt(amount, 10)
    // @ts-expect-error: preAmount should be a string
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
    const { asset, asset2, testWallet } = ammPool

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
      Account: testWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      LPTokenIn: lptokenIn,
      Flags: AMMWithdrawFlags.tfLPToken,
    }

    await testTransaction(testContext.client, ammWithdrawTx, testWallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { amount, amount2, lp_token } = amm

    expect(typeof amount).toBe('string')
    expect(typeof preAmount).toBe('string')
    expect(typeof amount2).toBe('object')
    expect(typeof preAmount2).toBe('object')

    // @ts-expect-error: amount should be a string
    const afterAmountDrops = parseInt(amount, 10)
    // @ts-expect-error: preAmount should be a string
    const beforeAmountDrops = parseInt(preAmount, 10)
    const diffAmountDrops = -9
    const expectedAmountDrops = beforeAmountDrops + diffAmountDrops

    const afterAmount2 = amount2
    const beforeAmount2 = preAmount2
    // @ts-expect-error: afterAmount2 should be an object
    const afterAmount2Value = parseInt(afterAmount2.value, 10)
    // @ts-expect-error: beforeAmount2 should be an object
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
