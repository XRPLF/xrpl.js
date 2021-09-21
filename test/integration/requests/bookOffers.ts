import { assert } from 'chai'
import _ from 'lodash'

import { BookOffersRequest, BookOffersResponse } from 'xrpl-local'

import serverUrl from '../serverUrl'
import { setupClient, suiteClientSetup, teardownClient } from '../setup'

// how long before each test case times out
const TIMEOUT = 20000

describe('BookOffers', function () {
  this.timeout(TIMEOUT)

  before(suiteClientSetup)
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
        issuer: this.wallet.getClassicAddress(),
      },
    }
    const response: BookOffersResponse = await this.client.request(bookOffer)
    assert.equal(response.status, 'success')
    assert.equal(response.type, 'response')
  })
})
