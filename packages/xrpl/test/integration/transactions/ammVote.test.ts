/* eslint-disable max-statements -- necessary for readibility */
import { assert } from 'chai'
import { AMMVote } from 'xrpl'

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

describe('AMMVote', function () {
  let testContext: XrplIntegrationTestContext
  let ammPool: TestAMMPool

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    ammPool = await setupAMMPool(testContext.client)
  })
  afterAll(async () => teardownClient(testContext))

  it('vote', async function () {
    const { asset, asset2, testWallet } = ammPool

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm: preAmm } = preAmmInfoRes.result
    const {
      auction_slot: preAuctionSlot,
      trading_fee: preTradingFee,
      vote_slots: preVoteSlots,
    } = preAmm

    assert.ok(preAuctionSlot)
    assert.ok(preVoteSlots)

    const { discounted_fee: preDiscountedFee } = preAuctionSlot

    const ammVoteTx: AMMVote = {
      TransactionType: 'AMMVote',
      Account: testWallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      TradingFee: 150,
    }

    await testTransaction(testContext.client, ammVoteTx, testWallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { auction_slot, trading_fee, vote_slots } = amm

    assert.ok(auction_slot)

    const { discounted_fee } = auction_slot

    assert.ok(vote_slots)

    const afterTradingFee = trading_fee
    const beforeTradingFee = preTradingFee
    const diffTradingFee = 76
    const expectedTradingFee = beforeTradingFee + diffTradingFee

    const afterDiscountedFee = discounted_fee
    const beforeDiscountedFee = preDiscountedFee
    const diffDiscountedFee = 7

    const expectedDiscountedFee = beforeDiscountedFee + diffDiscountedFee

    assert.equal(afterTradingFee, expectedTradingFee)
    assert.equal(afterDiscountedFee, expectedDiscountedFee)
    assert.equal(vote_slots.length - preVoteSlots.length, 1)
  })
})
