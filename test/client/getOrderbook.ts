import BigNumber from 'bignumber.js'
import { assert } from 'chai'

import { BookOffersRequest } from '../../src'
import { OfferLedgerFlags } from '../../src/models/ledger/offer'
import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import { assertResultMatch, assertRejects } from '../testUtils'

function checkSortingOfOrders(orders): boolean {
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
    assertResultMatch(response, responses.getOrderbook.withXRP, 'getOrderbook')
  })

  it('sample USD/XRP book has orders sorted correctly', async function () {
    this.mockRippled.addResponse('book_offers', xrpRippledResponse)
    const response = await this.client.getOrderbook(
      requests.getOrderbook.withXRP.taker_pays,
      requests.getOrderbook.withXRP.taker_gets,
    )
    checkSortingOfOrders(response.buy)
    checkSortingOfOrders(response.sell)
  })

  it('sorted so that best deals come first [bad test]', async function () {
    this.mockRippled.addResponse('book_offers', normalRippledResponse)
    const response = await this.client.getOrderbook(
      requests.getOrderbook.normal.taker_pays,
      requests.getOrderbook.normal.taker_gets,
    )
    const buyRates = response.buy.map(async (item) => item.quality as number)
    const sellRates = response.sell.map(async (item) => item.quality as number)
    // bids and asks should be sorted so that the best deals come first
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
      requests.getOrderbook.withXRP.taker_pays,
      requests.getOrderbook.withXRP.taker_gets,
    )
    const buyRates = response.buy.map(async (item) => item.quality as number)
    const sellRates = response.sell.map(async (item) => item.quality as number)
    // bids and asks should be sorted so that the best deals come first
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
      requests.getOrderbook.normal.taker_pays,
      requests.getOrderbook.normal.taker_gets,
    )
    assert.strictEqual(
      response.buy.every((item) => item.Flags !== OfferLedgerFlags.lsfSell),
      true,
    )
    assert.strictEqual(
      response.sell.every((item) => item.Flags === OfferLedgerFlags.lsfSell),
      true,
    )
  })
})
