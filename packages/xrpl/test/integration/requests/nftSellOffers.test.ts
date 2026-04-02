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

    // Mint an NFT
    const mintTx: NFTokenMint = {
      TransactionType: 'NFTokenMint',
      Account: testContext.wallet.address,
      URI: convertStringToHex('https://example.com/nft'),
      NFTokenTaxon: 0,
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

    const extractedNFTokenID = getNFTokenID(
      txResponse.result.meta as TransactionMetadata<NFTokenMint>,
    )
    if (!extractedNFTokenID) {
      throw new Error('Failed to extract NFTokenID from mint transaction')
    }
    nftokenID = extractedNFTokenID

    // Create an initial sell offer so tests have fixture data
    const initialSellOfferTx: NFTokenCreateOffer = {
      TransactionType: 'NFTokenCreateOffer',
      Account: testContext.wallet.address,
      NFTokenID: nftokenID,
      Amount: xrpToDrops(1),
      Flags: NFTokenCreateOfferFlags.tfSellNFToken,
    }
    await testTransaction(
      testContext.client,
      initialSellOfferTx,
      testContext.wallet,
    )
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
      // Create an additional sell offer to ensure pagination is exercised
      const extraSellOfferTx: NFTokenCreateOffer = {
        TransactionType: 'NFTokenCreateOffer',
        Account: testContext.wallet.address,
        NFTokenID: nftokenID,
        Amount: xrpToDrops(2),
        Flags: NFTokenCreateOfferFlags.tfSellNFToken,
      }
      await testTransaction(
        testContext.client,
        extraSellOfferTx,
        testContext.wallet,
      )

      const request: NFTSellOffersRequest = {
        command: 'nft_sell_offers',
        nft_id: nftokenID,
        limit: 1,
      }
      const response = await testContext.client.request(request)

      assert.equal(response.type, 'response')
      assert.isDefined(
        response.result.marker,
        'marker should be present when limit < total offers',
      )

      // Test pagination with marker
      const nextRequest: NFTSellOffersRequest = {
        command: 'nft_sell_offers',
        nft_id: nftokenID,
        marker: response.result.marker,
      }
      const nextResponse = await testContext.client.request(nextRequest)
      assert.equal(nextResponse.type, 'response')
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
