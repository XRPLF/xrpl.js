import BigNumber from 'bignumber.js'
import { assert } from 'chai'

import { BookOffersRequest, ValidationError } from 'xrpl-local'
import { OfferFlags } from 'xrpl-local/models/ledger/offer'

import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import { assertResultMatch, assertRejects } from '../testUtils'

function checkSortingOfOrders(orders): void {
  let previousRate = '0'
  for (const order of orders) {
    assert(
      new BigNumber(order.quality).isGreaterThanOrEqualTo(previousRate),
      `Rates must be sorted from least to greatest: ${
        order.quality as number
      } should be >= ${previousRate}`,
    )
    previousRate = order.quality
  }
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

function xrpRippledResponse(
  request: BookOffersRequest,
): Record<string, unknown> {
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

  it('normal', async function () {
    this.mockRippled.addResponse('book_offers', normalRippledResponse)
    const request = {
      takerPays: requests.getOrderbook.normal.takerPays,
      takerGets: requests.getOrderbook.normal.takerGets,
      options: {
        limit: 1,
      },
    }
    const response = await this.client.getOrderbook(
      request.takerPays,
      request.takerGets,
      request.options,
    )
    const expectedResponse = {
      buy: responses.getOrderbook.normal.buy.slice(0, request.options.limit),
      sell: responses.getOrderbook.normal.sell.slice(0, request.options.limit),
    }
    assertResultMatch(response, expectedResponse, 'getOrderbook')
  })

  it('invalid options', async function () {
    this.mockRippled.addResponse('book_offers', normalRippledResponse)
    assertRejects(
      this.client.getOrderbook(
        requests.getOrderbook.normal.takerPays,
        requests.getOrderbook.normal.takerGets,
        {
          invalid: 'options',
        },
      ),
      ValidationError,
    )
  })

  it('with XRP', async function () {
    this.mockRippled.addResponse('book_offers', xrpRippledResponse)
    const response = await this.client.getOrderbook(
      requests.getOrderbook.withXRP.takerPays,
      requests.getOrderbook.withXRP.takerGets,
    )
    assertResultMatch(response, responses.getOrderbook.withXRP, 'getOrderbook')
  })

  it('sample USD/XRP book has orders sorted correctly', async function () {
    this.mockRippled.addResponse('book_offers', xrpRippledResponse)
    const response = await this.client.getOrderbook(
      requests.getOrderbook.withXRP.takerPays,
      requests.getOrderbook.withXRP.takerGets,
    )
    checkSortingOfOrders(response.buy)
    checkSortingOfOrders(response.sell)
  })

  it('sorted so that best deals come first [failure test]', async function () {
    this.mockRippled.addResponse('book_offers', normalRippledResponse)
    const response = await this.client.getOrderbook(
      requests.getOrderbook.normal.takerPays,
      requests.getOrderbook.normal.takerGets,
    )
    const buyRates = response.buy.map(async (item) => item.quality as number)
    const sellRates = response.sell.map(async (item) => item.quality as number)
    // buy and sell orders should be sorted so that the best deals come first
    assert.deepEqual(
      buyRates.sort((item) => Number(item)),
      buyRates,
    )
    assert.deepEqual(
      sellRates.sort((item) => Number(item)),
      sellRates,
    )
  })

  it('sorted so that best deals come first [bad test](XRP)', async function () {
    this.mockRippled.addResponse('book_offers', xrpRippledResponse)
    const response = await this.client.getOrderbook(
      requests.getOrderbook.withXRP.takerPays,
      requests.getOrderbook.withXRP.takerGets,
    )
    const buyRates = response.buy.map(async (item) => item.quality as number)
    const sellRates = response.sell.map(async (item) => item.quality as number)
    // buy and sell orders should be sorted so that the best deals come first
    assert.deepEqual(
      buyRates.sort((item) => Number(item)),
      buyRates,
    )
    assert.deepEqual(
      sellRates.sort((item) => Number(item)),
      sellRates,
    )
  })

  it('direction is correct for buy and sell', async function () {
    this.mockRippled.addResponse('book_offers', normalRippledResponse)
    const response = await this.client.getOrderbook(
      requests.getOrderbook.normal.takerPays,
      requests.getOrderbook.normal.takerGets,
    )
    assert.strictEqual(
      response.buy.every((item) => item.Flags !== OfferFlags.lsfSell),
      true,
    )
    assert.strictEqual(
      response.sell.every((item) => item.Flags === OfferFlags.lsfSell),
      true,
    )
  })

  it('getOrderbook - limit', async function () {
    this.mockRippled.addResponse('book_offers', normalRippledResponse)
    const LIMIT = 3
    const response = await this.client.getOrderbook(
      requests.getOrderbook.normal.takerPays,
      requests.getOrderbook.normal.takerGets,
      {
        limit: LIMIT,
      },
    )
    assert(response.buy.length <= LIMIT)
    assert(response.sell.length <= LIMIT)
  })
})
