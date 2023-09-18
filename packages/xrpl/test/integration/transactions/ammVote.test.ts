import { assert } from 'chai'
import { AMMDeposit, AMMDepositFlags, AMMVote } from 'xrpl'

import { AMMInfoResponse, Wallet } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, setupAMMPool, testTransaction } from '../utils'

describe('AMMVote', function () {
  let testContext: XrplIntegrationTestContext
  let wallet: Wallet
  let wallet2: Wallet
  let wallet3: Wallet
  let currencyCode: string

  beforeAll(async () => {
    testContext = await setupClient(serverUrl)
    wallet = testContext.wallet
    wallet2 = await generateFundedWallet(testContext.client)
    wallet3 = await generateFundedWallet(testContext.client)
    currencyCode = 'USD'

    await setupAMMPool(testContext.client, wallet, wallet2, currencyCode)
  })
  afterAll(async () => teardownClient(testContext))

  it('vote', async function () {
    const ammDepositTx: AMMDeposit = {
      TransactionType: 'AMMDeposit',
      Account: wallet3.classicAddress,
      Asset: {
        currency: 'XRP',
      },
      Asset2: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
      },
      Amount: '1000',
      Flags: AMMDepositFlags.tfSingleAsset,
    }

    await testTransaction(testContext.client, ammDepositTx, wallet3)

    const preAmmInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset: {
        currency: 'XRP',
      },
      asset2: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
      },
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
      Account: wallet3.classicAddress,
      Asset: {
        currency: 'XRP',
      },
      Asset2: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
      },
      TradingFee: 150,
    }

    await testTransaction(testContext.client, ammVoteTx, wallet3)

    const ammInfoRes: AMMInfoResponse = await testContext.client.request({
      command: 'amm_info',
      asset: {
        currency: 'XRP',
      },
      asset2: {
        currency: currencyCode,
        issuer: wallet2.classicAddress,
      },
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
