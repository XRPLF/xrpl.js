import { assert } from 'chai'

import { BookOffersRequest, BookOffersResponse } from '../../../src'
import serverUrl from '../serverUrl'
import {
  setupClient,
  teardownClient,
  type XrplIntegrationTestContext,
} from '../setup'

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
})
