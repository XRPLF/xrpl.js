import { assert } from 'chai'
import { AMMClawback, AMMDeposit, AMMDepositFlags, XRP } from 'xrpl'

import { AMMInfoResponse } from '../../../src'
import type { MPTAmount } from '../../../src/models/common'
import { createAMMPoolWithMPT, type TestMPTAMMPool } from '../mptUtils'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { createAMMPool, testTransaction } from '../utils'

describe('AMMClawback', function () {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => teardownClient(testContext))

  it('base', async function () {
    const ammPool = await createAMMPool(testContext.client, true)
    const { issuerWallet } = ammPool
    const holderWallet = ammPool.lpWallet

    const asset = {
      currency: 'USD',
      issuer: issuerWallet.classicAddress,
    }
    const asset2 = {
      currency: 'XRP',
    } as XRP

    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: holderWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: {
        currency: 'USD',
        issuer: issuerWallet.address,
        value: '10',
      },
      Flags: AMMDepositFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, holderWallet)

    const ammClawback: AMMClawback = {
      TransactionType: 'AMMClawback',
      Account: issuerWallet.address,
      Holder: holderWallet.address,
      Asset: asset,
      Asset2: asset2,
    }

    await testTransaction(testContext.client, ammClawback, issuerWallet)
  })

  it('clawback MPT from AMM pool', async function () {
    const mptPool: TestMPTAMMPool = await createAMMPoolWithMPT(
      testContext.client,
    )
    const { asset, asset2, issuerWallet1, lpWallet } = mptPool

    // Record pre-clawback pool balance
    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })
    const preAmount = preAmmInfoRes.result.amm.amount as MPTAmount

    // Issuer claws back MPT from the AMM holder
    const ammClawbackMPT: AMMClawback = {
      TransactionType: 'AMMClawback',
      Account: issuerWallet1.classicAddress,
      Holder: lpWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      Amount: {
        mpt_issuance_id: asset.mpt_issuance_id,
        value: '10',
      },
    }

    await testTransaction(testContext.client, ammClawbackMPT, issuerWallet1)

    // Verify pool balance decreased
    const postAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })
    const postAmount = postAmmInfoRes.result.amm.amount as MPTAmount

    assert.isBelow(
      parseInt(postAmount.value, 10),
      parseInt(preAmount.value, 10),
    )
  })
})
