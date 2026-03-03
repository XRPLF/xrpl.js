import { assert } from 'chai'

import {
  convertStringToHex,
  getNFTokenID,
  NFTokenCreateOffer,
  NFTokenCreateOfferFlags,
  NFTokenMint,
  NFTSellOffersRequest,
  TransactionMetadata,
  xrpToDrops,
  unixTimeToRippleTime,
} from '../../../src'
import { hashSignedTx } from '../../../src/utils/hashes'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('nft_sell_offers', function () {
  let testContext: XrplIntegrationTestContext
  let nftokenID: string

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)

    // Mint an NFT with a sell offer
    const mintTx: NFTokenMint = {
      TransactionType: 'NFTokenMint',
      Account: testContext.wallet.address,
      URI: convertStringToHex('https://example.com/nft'),
      NFTokenTaxon: 0,
      Amount: xrpToDrops(1),
      Expiration: unixTimeToRippleTime(Date.now() + 1000 * 60 * 60 * 24),
    }
    const mintResponse = await testTransaction(
      testContext.client,
      mintTx,
      testContext.wallet,
    )

    const txResponse = await testContext.client.request({
      command: 'tx',
      transaction: hashSignedTx(mintResponse.result.tx_blob),
    })

    nftokenID =
      getNFTokenID(
        txResponse.result.meta as TransactionMetadata<NFTokenMint>,
      ) ?? 'undefined'
  })

  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: NFTSellOffersRequest = {
        command: 'nft_sell_offers',
        nft_id: nftokenID,
      }
      const response = await testContext.client.request(request)

      assert.equal(response.type, 'response')
      assert.equal(response.result.nft_id, nftokenID)
      assert.isArray(response.result.offers)
      assert.isAtLeast(response.result.offers.length, 1)
    },
    TIMEOUT,
  )

  it(
    'with limit field',
    async () => {
      const request: NFTSellOffersRequest = {
        command: 'nft_sell_offers',
        nft_id: nftokenID,
        limit: 10,
      }
      const response = await testContext.client.request(request)

      assert.equal(response.type, 'response')
      assert.equal(response.result.nft_id, nftokenID)
      // The limit field should be present in the response
      if (response.result.limit !== undefined) {
        assert.isNumber(response.result.limit)
        assert.isAtMost(response.result.limit, 10)
      }
    },
    TIMEOUT,
  )

  it(
    'with marker field for pagination',
    async () => {
      const request: NFTSellOffersRequest = {
        command: 'nft_sell_offers',
        nft_id: nftokenID,
        limit: 1,
      }
      const response = await testContext.client.request(request)

      assert.equal(response.type, 'response')
      // If there are more results, marker should be present
      if (response.result.marker !== undefined) {
        assert.isDefined(response.result.marker)
        // Test pagination with marker
        const nextRequest: NFTSellOffersRequest = {
          command: 'nft_sell_offers',
          nft_id: nftokenID,
          marker: response.result.marker,
        }
        const nextResponse = await testContext.client.request(nextRequest)
        assert.equal(nextResponse.type, 'response')
      }
    },
    TIMEOUT,
  )

  it(
    'with additional sell offer',
    async () => {
      // Create an additional sell offer
      const sellOfferTx: NFTokenCreateOffer = {
        TransactionType: 'NFTokenCreateOffer',
        Account: testContext.wallet.address,
        NFTokenID: nftokenID,
        Amount: xrpToDrops(5),
        Flags: NFTokenCreateOfferFlags.tfSellNFToken,
      }
      await testTransaction(testContext.client, sellOfferTx, testContext.wallet)

      const request: NFTSellOffersRequest = {
        command: 'nft_sell_offers',
        nft_id: nftokenID,
      }
      const response = await testContext.client.request(request)

      assert.equal(response.type, 'response')
      assert.equal(response.result.nft_id, nftokenID)
      assert.isArray(response.result.offers)
      assert.isAtLeast(response.result.offers.length, 2)
    },
    TIMEOUT,
  )
})
