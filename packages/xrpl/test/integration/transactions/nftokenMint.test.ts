import { assert } from 'chai'

import {
  convertStringToHex,
  getNFTokenID,
  NFTokenMint,
  TransactionMetadata,
  TxRequest,
  unixTimeToRippleTime,
  Wallet,
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

describe('NFTokenMint', function () {
  let testContext: XrplIntegrationTestContext
  let destinationWallet: Wallet

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
    destinationWallet = await generateFundedWallet(testContext.client)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'get NFTokenID',
    async function () {
      const tx: NFTokenMint = {
        TransactionType: 'NFTokenMint',
        Account: testContext.wallet.address,
        URI: convertStringToHex('https://www.google.com'),
        NFTokenTaxon: 0,
      }
      const response = await testTransaction(
        testContext.client,
        tx,
        testContext.wallet,
      )
      assert.equal(response.type, 'response')

      const txRequest: TxRequest = {
        command: 'tx',
        transaction: hashSignedTx(response.result.tx_blob),
      }
      const txResponse = await testContext.client.request(txRequest)

      assert.equal(
        (txResponse.result.meta as TransactionMetadata).TransactionResult,
        'tesSUCCESS',
      )

      const accountNFTs = await testContext.client.request({
        command: 'account_nfts',
        account: testContext.wallet.address,
      })

      const nftokenID =
        getNFTokenID(
          txResponse.result.meta as TransactionMetadata<NFTokenMint>,
        ) ?? 'undefined'

      const accountHasNFT = accountNFTs.result.account_nfts.some(
        (value) => value.NFTokenID === nftokenID,
      )

      assert.isTrue(
        accountHasNFT,
        `Expected to find an NFT with NFTokenID ${nftokenID} in account ${
          testContext.wallet.address
        } but did not find it.
      \n\nHere's what was returned from 'account_nfts' for ${
        testContext.wallet.address
      }: ${JSON.stringify(accountNFTs)}`,
      )

      const binaryTxResponse = await testContext.client.request({
        ...txRequest,
        binary: true,
      })

      assert.equal(
        nftokenID,
        getNFTokenID(binaryTxResponse.result.meta_blob) ?? 'undefined',
        `getNFTokenID produced a different outcome when decoding the metadata in binary format.`,
      )
    },
    TIMEOUT,
  )

  it(
    'test with Amount',
    async function () {
      const tx: NFTokenMint = {
        TransactionType: 'NFTokenMint',
        Account: testContext.wallet.address,
        URI: convertStringToHex('https://www.google.com'),
        NFTokenTaxon: 0,
        Amount: xrpToDrops(1),
        Expiration: unixTimeToRippleTime(Date.now() + 1000 * 60 * 60 * 24),
        Destination: destinationWallet.address,
      }
      const response = await testTransaction(
        testContext.client,
        tx,
        testContext.wallet,
      )
      assert.equal(response.type, 'response')

      const txRequest: TxRequest = {
        command: 'tx',
        transaction: hashSignedTx(response.result.tx_blob),
      }
      const txResponse = await testContext.client.request(txRequest)

      assert.equal(
        (txResponse.result.meta as TransactionMetadata).TransactionResult,
        'tesSUCCESS',
      )

      const nftokenID =
        getNFTokenID(
          txResponse.result.meta as TransactionMetadata<NFTokenMint>,
        ) ?? 'undefined'

      const nftokenOfferID = (
        txResponse.result.meta as TransactionMetadata<NFTokenMint>
      ).offer_id

      const sellOffers = await testContext.client.request({
        command: 'nft_sell_offers',
        nft_id: nftokenID,
      })

      const existsOffer = sellOffers.result.offers.some(
        (value) => value.nft_offer_index === nftokenOfferID,
      )

      assert.isTrue(
        existsOffer,
        `Expected to exist an offer for NFT with NFTokenID ${nftokenID} but did not find it.
      \n\nHere's what was returned from 'nft_sell_offers': ${JSON.stringify(
        sellOffers,
      )}`,
      )
    },
    TIMEOUT,
  )
})
