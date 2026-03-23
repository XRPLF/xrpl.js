/* eslint-disable max-statements -- necessary for readibility */
import { assert } from 'chai'
import { AMMDeposit, AMMDepositFlags } from 'xrpl'

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

describe('AMMDeposit', function () {
  let testContext: XrplIntegrationTestContext
  let ammPool: TestAMMPool

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    ammPool = await setupAMMPool(testContext.client)
  })
  afterAll(async () => teardownClient(testContext))

  it('deposit with Amount', async function () {
    const { asset, asset2, testWallet } = ammPool

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const { amount: preAmount, amount2: preAmount2 } = preAmm

    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: testWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '1000',
      Flags: AMMDepositFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, testWallet)

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
    const diffAmountDrops = 1000
    const expectedAmountDrops = beforeAmountDrops + diffAmountDrops

    const afterAmount2 = amount2
    const beforeAmount2 = preAmount2

    const afterLPToken = lp_token
    const beforeLPToken = preAmm.lp_token
    const afterLPTokenValue = parseInt(afterLPToken.value, 10)
    const beforeLPTokenValue = parseInt(beforeLPToken.value, 10)
    const diffLPTokenValue = 191
    const expectedLPTokenValue = beforeLPTokenValue + diffLPTokenValue

    assert.equal(afterAmountDrops, expectedAmountDrops)
    assert.deepEqual(afterAmount2, beforeAmount2)
    assert.equal(afterLPTokenValue, expectedLPTokenValue)
  })

  it('deposit with Amount and Amount2', async function () {
    const { asset, asset2, issuerWallet } = ammPool

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const { amount: preAmount, amount2: preAmount2 } = preAmm

    assert.ok(asset2.issuer)

    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: issuerWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '100',
      Amount2: {
        currency: asset2.currency,
        issuer: asset2.issuer,
        value: '100',
      },
      Flags: AMMDepositFlags.tfTwoAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, issuerWallet)

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
    const diffAmountDrops = 100
    const expectedAmountDrops = beforeAmountDrops + diffAmountDrops

    const afterAmount2 = amount2
    const beforeAmount2 = preAmount2
    // @ts-expect-error: afterAmount2 should be an object
    const afterAmount2Value = parseInt(afterAmount2.value, 10)
    // @ts-expect-error: beforeAmount2 should be an object
    const beforeAmount2Value = parseInt(beforeAmount2.value, 10)
    const diffAmount2Value = 11
    const expectedAmount2Value = beforeAmount2Value + diffAmount2Value

    const afterLPToken = lp_token
    const beforeLPToken = preAmm.lp_token
    const afterLPTokenValue = parseInt(afterLPToken.value, 10)
    const beforeLPTokenValue = parseInt(beforeLPToken.value, 10)
    const diffLPTokenValue = 34
    const expectedLPTokenValue = beforeLPTokenValue + diffLPTokenValue

    assert.equal(afterAmountDrops, expectedAmountDrops)
    assert.equal(afterAmount2Value, expectedAmount2Value)
    assert.equal(afterLPTokenValue, expectedLPTokenValue)
  })

  it('deposit with Amount and LPTokenOut', async function () {
    const { asset, asset2, issuerWallet } = ammPool

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

    const lptokenOut = { ...preLPToken, value: '5' }
    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: issuerWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '100',
      LPTokenOut: lptokenOut,
      Flags: AMMDepositFlags.tfOneAssetLPToken,
    }

    await testTransaction(testContext.client, ammDepositTx, issuerWallet)

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
    const diffAmountDrops = 30
    const expectedAmountDrops = beforeAmountDrops + diffAmountDrops

    const afterAmount2 = amount2
    const beforeAmount2 = preAmount2

    const afterLPToken = lp_token
    const beforeLPToken = preLPToken
    const afterLPTokenValue = parseInt(afterLPToken.value, 10)
    const beforeLPTokenValue = parseInt(beforeLPToken.value, 10)
    const diffLPTokenValue = 5
    const expectedLPTokenValue = beforeLPTokenValue + diffLPTokenValue

    assert.equal(afterAmountDrops, expectedAmountDrops)
    assert.deepEqual(afterAmount2, beforeAmount2)
    assert.equal(afterLPTokenValue, expectedLPTokenValue)
  })

  it('deposit with LPTokenOut', async function () {
    const { asset, asset2, issuerWallet } = ammPool

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

    const lptokenOut = { ...preLPToken, value: '5' }
    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: issuerWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      LPTokenOut: lptokenOut,
      Flags: AMMDepositFlags.tfLPToken,
    }

    await testTransaction(testContext.client, ammDepositTx, issuerWallet)

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
    const diffAmountDrops = 15
    const expectedAmountDrops = beforeAmountDrops + diffAmountDrops

    const afterAmount2 = amount2
    const beforeAmount2 = preAmount2
    // @ts-expect-error: afterAmount2 should be an object
    const afterAmount2Value = parseInt(afterAmount2.value, 10)
    // @ts-expect-error: beforeAmount2 should be an object
    const beforeAmount2Value = parseInt(beforeAmount2.value, 10)
    const diffAmount2Value = 1
    const expectedAmount2Value = beforeAmount2Value + diffAmount2Value

    const afterLPToken = lp_token
    const beforeLPToken = preLPToken
    const afterLPTokenValue = parseInt(afterLPToken.value, 10)
    const beforeLPTokenValue = parseInt(beforeLPToken.value, 10)
    const diffLPTokenValue = 5
    const expectedLPTokenValue = beforeLPTokenValue + diffLPTokenValue

    assert.equal(afterAmountDrops, expectedAmountDrops)
    assert.equal(afterAmount2Value, expectedAmount2Value)
    assert.equal(afterLPTokenValue, expectedLPTokenValue)
  })
})
