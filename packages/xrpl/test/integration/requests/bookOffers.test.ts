import { assert } from 'chai'

import {
  BookOffersRequest,
  BookOffersResponse,
  MPTokenIssuanceCreateFlags,
  OfferCreate,
} from '../../../src'
import { createMPTIssuanceAndAuthorize } from '../mptUtils'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'
import { generateFundedWallet, testTransaction } from '../utils'

// how long before each test case times out
const TIMEOUT = 20000

describe('book_offers', function () {
  let testContext: XrplIntegrationTestContext

  beforeEach(async () => {
    testContext = await setupClient(serverUrl)
  })
  afterEach(async () => teardownClient(testContext))

  it(
    'base',
    async () => {
      const bookOffer: BookOffersRequest = {
        command: 'book_offers',
        taker_gets: {
          currency: 'XRP',
        },
        taker_pays: {
          currency: 'USD',
          issuer: testContext.wallet.classicAddress,
        },
      }
      const response = await testContext.client.request(bookOffer)

      const expectedResponse: BookOffersResponse = {
        api_version: 2,
        id: response.id,
        type: 'response',
        result: {
          ledger_current_index: response.result.ledger_current_index,
          offers: response.result.offers,
          validated: false,
        },
      }

      assert.deepEqual(response, expectedResponse)
    },
    TIMEOUT,
  )

  it(
    'book_offers with MPT',
    async () => {
      const issuerWallet = await generateFundedWallet(testContext.client)
      const sourceWallet = await generateFundedWallet(testContext.client)

      const mptIssuanceId = await createMPTIssuanceAndAuthorize(
        testContext.client,
        issuerWallet,
        sourceWallet,
        MPTokenIssuanceCreateFlags.tfMPTCanTrade |
          MPTokenIssuanceCreateFlags.tfMPTCanTransfer,
      )

      // Create an offer: sell 10 MPT for 100000 XRP drops
      const offerTx: OfferCreate = {
        TransactionType: 'OfferCreate',
        Account: sourceWallet.classicAddress,
        TakerGets: {
          mpt_issuance_id: mptIssuanceId,
          value: '10',
        },
        TakerPays: '100000',
      }
      await testTransaction(testContext.client, offerTx, sourceWallet)

      // Query book_offers with MPT
      const bookOffer: BookOffersRequest = {
        command: 'book_offers',
        // @ts-expect-error -- MPTCurrency support will be added to BookOffersRequest
        taker_gets: { mpt_issuance_id: mptIssuanceId },
        taker_pays: { currency: 'XRP' },
      }
      const response = await testContext.client.request(bookOffer)

      assert.equal(response.type, 'response')
      assert.isAtLeast(response.result.offers.length, 1)

      const matchingOffer = response.result.offers.find(
        (offer) => offer.Account === sourceWallet.classicAddress,
      )
      assert.ok(matchingOffer, 'Should find an offer from the source wallet')
      assert.deepEqual(matchingOffer!.TakerGets, {
        mpt_issuance_id: mptIssuanceId,
        value: '10',
      })
      assert.equal(matchingOffer!.TakerPays, '100000')
    },
    TIMEOUT,
  )
})
