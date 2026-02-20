/* eslint-disable max-statements -- necessary for readibility */
import { assert } from 'chai'
import { AMMWithdraw, AMMWithdrawFlags } from 'xrpl'

import { AMMInfoResponse } from '../../../src'
import type { MPTAmount } from '../../../src/models/common'
import { createAMMPoolWithMPT, type TestMPTAMMPool } from '../mptUtils'
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

  it('withdraw single MPT asset', async function () {
    const mptPool: TestMPTAMMPool = await createAMMPoolWithMPT(
      testContext.client,
    )
    const { asset, asset2, lpWallet } = mptPool

    // Get pre-withdraw state
    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })
    const { amm: preAmm } = preAmmInfoRes.result
    const preAmount = preAmm.amount as MPTAmount
    const preAmount2 = preAmm.amount2 as MPTAmount

    // Withdraw single MPT asset
    const ammWithdrawTx: AMMWithdraw = {
      TransactionType: 'AMMWithdraw',
      Account: lpWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: {
        mpt_issuance_id: asset.mpt_issuance_id,
        value: '50',
      },
      Flags: AMMWithdrawFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammWithdrawTx, lpWallet)

    // Get post-withdraw state
    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })
    const { amm } = ammInfoRes.result
    const postAmount = amm.amount as MPTAmount
    const postAmount2 = amm.amount2 as MPTAmount

    // Pool balance of withdrawn asset should decrease by 50
    assert.equal(
      parseInt(postAmount.value, 10),
      parseInt(preAmount.value, 10) - 50,
    )
    // Other asset should remain unchanged
    assert.equal(postAmount2.value, preAmount2.value)
    // LP token supply should decrease
    const postLPTokenValue = parseInt(amm.lp_token.value, 10)
    const preLPTokenValue = parseInt(preAmm.lp_token.value, 10)
    assert.isBelow(postLPTokenValue, preLPTokenValue)
  })

  it('withdraw all MPT (AMM delete)', async function () {
    const mptPool: TestMPTAMMPool = await createAMMPoolWithMPT(
      testContext.client,
    )
    const { asset, asset2, lpWallet } = mptPool

    // Withdraw all to delete the AMM
    const ammWithdrawTx: AMMWithdraw = {
      TransactionType: 'AMMWithdraw',
      Account: lpWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Flags: AMMWithdrawFlags.tfWithdrawAll,
    }

    await testTransaction(testContext.client, ammWithdrawTx, lpWallet)

    // Verify the AMM no longer exists
    try {
      await testContext.client.request({
        command: 'amm_info',
        asset,
        asset2,
      })
      assert.fail('Expected amm_info to fail for deleted AMM')
    } catch (error: unknown) {
      const err = error as { data?: { error?: string } }
      assert.equal(err.data?.error, 'actNotFound')
    }
  })
})
