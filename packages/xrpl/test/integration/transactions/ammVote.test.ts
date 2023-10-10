import { assert } from 'chai'
import { AMMVote } from 'xrpl'

import { AMMInfoResponse } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

describe('AMMVote', function () {
  let testContext: XrplIntegrationTestContext

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterAll(async () => teardownClient(testContext))

  it('vote', async function () {
    const { asset, asset2 } = testContext.amm
    const { wallet } = testContext

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
    if (preAuctionSlot === undefined) {
      throw new Error('preAuctionSlot should not be undefined')
    }
    const { discounted_fee: preDiscountedFee } = preAuctionSlot
    if (preVoteSlots === undefined) {
      throw new Error('preVoteSlots should not be undefined')
    }

    const ammVoteTx: AMMVote = {
      TransactionType: 'AMMVote',
      Account: wallet.classicAddress,
      Asset: asset,
      Asset2: asset2,
      TradingFee: 150,
    }

    await testTransaction(testContext.client, ammVoteTx, wallet)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset,
      asset2,
    })

    const { amm } = ammInfoRes.result
    const { auction_slot, trading_fee, vote_slots } = amm

    assert.equal(trading_fee > preTradingFee, true)

    if (auction_slot === undefined) {
      throw new Error('auction_slot should not be undefined')
    }
    const { discounted_fee } = auction_slot
    assert.equal(discounted_fee > preDiscountedFee, true)

    if (vote_slots === undefined) {
      throw new Error('vote_slots should not be undefined')
    }
    assert.equal(vote_slots.length - preVoteSlots.length, 1)
  })
})
