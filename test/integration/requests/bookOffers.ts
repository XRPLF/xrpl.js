import { assert } from 'chai'
import _ from 'lodash'

import { BookOffersRequest, BookOffersResponse } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('book_offers', function () {
  this.timeout(TIMEOUT)

  beforeEach(_.partial(setupClient, serverUrl))
  afterEach(teardownClient)

  it('base', async function () {
    const bookOffer: BookOffersRequest = {
      command: 'book_offers',
      taker_gets: {
        currency: 'XRP',
      },
      taker_pays: {
        currency: 'USD',
        issuer: this.wallet.classicAddress,
      },
    }
    const response = await this.client.request(bookOffer)

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
  })
})
