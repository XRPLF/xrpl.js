import { assert } from 'chai'
import { AMMDeposit, AMMDepositFlags } from 'xrpl'

import { AMMInfoResponse } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

describe('AMMDeposit', function () {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => teardownClient(testContext))

  it('deposit with Amount', async function () {
    const { asset, asset2 } = testContext.amm

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset: testContext.amm.asset,
      asset2: testContext.amm.asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const { amount: preAmount, amount2: preAmount2 } = preAmm

    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: testContext.wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: '1000',
      Flags: AMMDepositFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, testContext.wallet)

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
    assert.equal(parseInt(amount, 10) > parseInt(preAmount, 10), true)
    assert.deepEqual(amount2, preAmount2)
  })

  it('deposit with Amount and Amount2', async function () {
    const { asset, asset2, issuerWallet } = testContext.amm

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const { amount: preAmount, amount2: preAmount2 } = preAmm

    if (asset2.issuer == null) {
      throw new Error('asset2.issuer should not be null')
    }

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
    const { amount, amount2 } = amm

    if (typeof amount !== 'string') {
      throw new Error('amount should be a string')
    }
    if (typeof preAmount !== 'string') {
      throw new Error('preAmount should be a string')
    }
    assert.equal(parseInt(amount, 10) > parseInt(preAmount, 10), true)

    if (typeof amount2 !== 'object') {
      throw new Error('amount2 should be an object')
    }
    if (typeof preAmount2 !== 'object') {
      throw new Error('preAmount2 should be an object')
    }
    assert.equal(
      parseInt(amount2.value, 10) > parseInt(preAmount2.value, 10),
      true,
    )
  })

  it('deposit with Amount and LPTokenOut', async function () {
    const { asset, asset2, issuerWallet } = testContext.amm

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

    if (typeof amount !== 'string') {
      throw new Error('amount should be a string')
    }
    if (typeof preAmount !== 'string') {
      throw new Error('preAmount should be a string')
    }
    assert.equal(parseInt(amount, 10) > parseInt(preAmount, 10), true)

    if (typeof amount2 !== 'object') {
      throw new Error('amount2 should be an object')
    }
    if (typeof preAmount2 !== 'object') {
      throw new Error('preAmount2 should be an object')
    }
    assert.deepEqual(amount2, preAmount2)

    assert.equal(
      parseInt(lp_token.value, 10) > parseInt(preLPToken.value, 10),
      true,
    )
  })

  it('deposit with LPTokenOut', async function () {
    const { asset, asset2, issuerWallet } = testContext.amm

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

    if (typeof amount !== 'string') {
      throw new Error('amount should be a string')
    }
    if (typeof preAmount !== 'string') {
      throw new Error('preAmount should be a string')
    }
    assert.equal(parseInt(amount, 10) > parseInt(preAmount, 10), true)

    if (typeof amount2 !== 'object') {
      throw new Error('amount2 should be an object')
    }
    if (typeof preAmount2 !== 'object') {
      throw new Error('preAmount2 should be an object')
    }
    assert.deepEqual(
      parseInt(amount2.value, 10) > parseInt(preAmount2.value, 10),
      true,
    )

    assert.equal(
      parseInt(lp_token.value, 10) > parseInt(preLPToken.value, 10),
      true,
    )
  })
})
