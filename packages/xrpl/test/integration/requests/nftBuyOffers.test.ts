import { assert } from 'chai'

import {
  convertStringToHex,
  getNFTokenID,
  NFTokenCreateOffer,
  NFTokenMint,
  NFTokenMintFlags,
  NFTBuyOffersRequest,
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
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('nft_buy_offers', function () {
  let testContext: XrplIntegrationTestContext
  let nftokenID: string

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)

    // Mint an NFT for testing
    const mintTx: NFTokenMint = {
      TransactionType: 'NFTokenMint',
      Account: testContext.wallet.address,
      URI: convertStringToHex('https://example.com/nft'),
      NFTokenTaxon: 0,
      Flags: NFTokenMintFlags.tfTransferable,
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

    // Create a buy offer for the NFT
    const buyerWallet = await generateFundedWallet(testContext.client)
    const buyOfferTx: NFTokenCreateOffer = {
      TransactionType: 'NFTokenCreateOffer',
      Account: buyerWallet.address,
      NFTokenID: nftokenID,
      Amount: xrpToDrops(10),
      Owner: testContext.wallet.address,
    }
    await testTransaction(testContext.client, buyOfferTx, buyerWallet)
  })

  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const request: NFTBuyOffersRequest = {
        command: 'nft_buy_offers',
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
      const request: NFTBuyOffersRequest = {
        command: 'nft_buy_offers',
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
      // Create an additional buy offer to ensure pagination is exercised
      const buyerWallet2 = await generateFundedWallet(testContext.client)
      const secondBuyOfferTx: NFTokenCreateOffer = {
        TransactionType: 'NFTokenCreateOffer',
        Account: buyerWallet2.address,
        NFTokenID: nftokenID,
        Amount: xrpToDrops(11),
        Owner: testContext.wallet.address,
      }
      await testTransaction(testContext.client, secondBuyOfferTx, buyerWallet2)

      const request: NFTBuyOffersRequest = {
        command: 'nft_buy_offers',
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
      const nextRequest: NFTBuyOffersRequest = {
        command: 'nft_buy_offers',
        nft_id: nftokenID,
        marker: response.result.marker,
      }
      const nextResponse = await testContext.client.request(nextRequest)
      assert.equal(nextResponse.type, 'response')
    },
    TIMEOUT,
  )
})
