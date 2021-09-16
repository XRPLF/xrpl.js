import BigNumber from 'bignumber.js'
import { assert } from 'chai'

import { BookOffersRequest } from '../../src'
import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import {
  /* addressTests, */ assertResultMatch,
  assertRejects,
} from '../testUtils'

function checkSortingOfOrders(orders) {
  let previousRate = '0'
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    let rate

    // We calculate the quality of output/input here as a test.
    // This won't hold in general because when output and input amounts get tiny,
    // the quality can differ significantly. However, the offer stays in the
    // order book where it was originally placed. It would be more consistent
    // to check the quality from the offer book, but for the test data set,
    // this calculation holds.

    if (order.specification.direction === 'buy') {
      rate = new BigNumber(order.specification.quantity.value)
        .dividedBy(order.specification.totalPrice.value)
        .toString()
    } else {
      rate = new BigNumber(order.specification.totalPrice.value)
        .dividedBy(order.specification.quantity.value)
        .toString()
    }
    assert(
      new BigNumber(rate).isGreaterThanOrEqualTo(previousRate),
      `Rates must be sorted from least to greatest: ${rate} should be >= ${previousRate}`,
    )
    previousRate = rate
  }
  return true
}

function isUSD(currency: string): boolean {
  return (
    currency === 'USD' ||
    currency === '0000000000000000000000005553440000000000'
  )
}

function isBTC(currency: string): boolean {
  return (
    currency === 'BTC' ||
    currency === '0000000000000000000000004254430000000000'
  )
}

function normalRippledResponse(
  request: BookOffersRequest,
): Record<string, unknown> {
  if (
    isBTC(request.taker_gets.currency) &&
    isUSD(request.taker_pays.currency)
  ) {
    return rippled.book_offers.fabric.requestBookOffersBidsResponse(request)
  }
  if (
    isUSD(request.taker_gets.currency) &&
    isBTC(request.taker_pays.currency)
  ) {
    return rippled.book_offers.fabric.requestBookOffersAsksResponse(request)
  }
  throw new Error('unexpected end')
}

function xrpRippledResponse(request: BookOffersRequest): object {
  if (request.taker_pays.issuer === 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw') {
    return rippled.book_offers.xrp_usd
  }
  if (request.taker_gets.issuer === 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw') {
    return rippled.book_offers.usd_xrp
  }
  throw new Error('unexpected end')
}

describe('client.getOrderbook', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  // eslint-disable-next-line mocha/no-setup-in-describe -- Rule does not allow dynamic test generation.
  // addressTests.forEach(function (testCase) {
  describe('Classic Address', function () {
    it('normal', async function () {
      this.mockRippled.addResponse('book_offers', normalRippledResponse)
      const response = await this.client.getOrderbook(
        requests.getOrderbook.normal.taker_pays,
        requests.getOrderbook.normal.taker_gets,
        {
          limit: 1,
        },
      )
      assertResultMatch(response, responses.getOrderbook.normal, 'getOrderbook')
    })

    it('invalid options', async function () {
      this.mockRippled.addResponse('book_offers', normalRippledResponse)
      assertRejects(
        this.client.getOrderbook(
          requests.getOrderbook.normal.taker_pays,
          requests.getOrderbook.normal.taker_gets,
          {
            invalid: 'options',
          },
        ),
        this.client.errors.ValidationError,
      )
    })

    it('with XRP', async function () {
      this.mockRippled.addResponse('book_offers', xrpRippledResponse)
      const response = await this.client.getOrderbook(
        requests.getOrderbook.withXRP.taker_pays,
        requests.getOrderbook.withXRP.taker_gets,
      )
      assertResultMatch(
        response,
        responses.getOrderbook.withXRP,
        'getOrderbook',
      )
    })

    // it('sample XRP/JPY book has orders sorted correctly', async function () {
    //   this.mockRippled.addResponse('book_offers', jpyRippledResponse)
    //   const orderbookInfo = {
    //     taker_pays: {
    //       // the first currency in pair
    //       currency: 'XRP',
    //     },
    //     taker_gets: {
    //       currency: 'JPY',
    //       issuer: 'rB3gZey7VWHYRqJHLoHDEJXJ2pEPNieKiS',
    //     },
    //   }
    //   // const myAddress = 'rE9qNjzJXpiUbVomdv7R4xhrXVeH2oVmGR'
    //   const response = await this.client.getOrderbook(
    //     orderbookInfo.taker_pays,
    //     orderbookInfo.taker_gets,
    //   )
    //   console.log('ressss--->', response)
    //   assert.deepStrictEqual([], response.buy)
    //   // checkSortingOfOrders(response.asks)
    // })

    it('sample USD/XRP book has orders sorted correctly', async function () {
      this.mockRippled.addResponse('book_offers', xrpRippledResponse)
      // const orderbookInfo = {
      //   taker_pays: { currency: 'XRP' },
      //   taker_gets: {
      //     currency: 'USD',
      //     issuer: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B',
      //   },
      // }
      const response = await this.client.getOrderbook(
        requests.getOrderbook.withXRP.taker_pays,
        requests.getOrderbook.withXRP.taker_gets,
      )
      checkSortingOfOrders(response.buy)
      checkSortingOfOrders(response.sell)
    })

    // WARNING: This test fails to catch the sorting bug, issue #766
    // it("sorted so that best deals come first [bad test]", async function () {
    //   this.mockRippled.addResponse("book_offers", normalRippledResponse);
    //   const response = await this.client.getOrderbook(
    //     test.address,
    //     requests.getOrderbook.normal
    //   );
    //   const bidRates = response.bids.map(
    //     (bid) => bid.properties.makerExchangeRate
    //   );
    //   const askRates = response.asks.map(
    //     (ask) => ask.properties.makerExchangeRate
    //   );
    //   // makerExchangeRate = quality = takerPays.value/takerGets.value
    //   // so the best deal for the taker is the lowest makerExchangeRate
    //   // bids and asks should be sorted so that the best deals come first
    //   assert.deepEqual(
    //     bidRates.sort((x) => Number(x)),
    //     bidRates
    //   );
    //   assert.deepEqual(
    //     askRates.sort((x) => Number(x)),
    //     askRates
    //   );
    // });

    it('direction is correct for buy and sell', async function () {
      this.mockRippled.addResponse('book_offers', normalRippledResponse)
      const response = await this.client.getOrderbook(
        requests.getOrderbook.normal.taker_pays,
        requests.getOrderbook.normal.taker_gets,
      )
      assert.strictEqual(
        response.buy.every((item) => item.Flags === 0),
        true,
      )
      assert.strictEqual(
        response.sell.every((item) => item.Flags !== 0),
        true,
      )
    })
  })
})
// })
