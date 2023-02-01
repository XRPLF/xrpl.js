import BigNumber from 'bignumber.js'
import { assert } from 'chai'

import { BookOffersRequest, type Request } from '../../src'
import { ValidationError, XrplError } from '../../src/errors'
import { OfferFlags } from '../../src/models/ledger'
import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import {
  setupClient,
  teardownClient,
  type XrplTestContext,
} from '../setupClient'
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

function normalRippledResponse(request: Request): Record<string, unknown> {
  if (
    isBTC((request as BookOffersRequest).taker_gets.currency) &&
    isUSD((request as BookOffersRequest).taker_pays.currency)
  ) {
    return rippled.book_offers.fabric.requestBookOffersBidsResponse(request)
  }
  if (
    isUSD((request as BookOffersRequest).taker_gets.currency) &&
    isBTC((request as BookOffersRequest).taker_pays.currency)
  ) {
    return rippled.book_offers.fabric.requestBookOffersAsksResponse(request)
  }
  throw new XrplError('unexpected end')
}

function xrpRippledResponse(request: Request): Record<string, unknown> {
  if (
    (request as BookOffersRequest).taker_pays.issuer ===
    'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw'
  ) {
    return rippled.book_offers.xrp_usd
  }
  if (
    (request as BookOffersRequest).taker_gets.issuer ===
    'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw'
  ) {
    return rippled.book_offers.usd_xrp
  }
  throw new Error('unexpected end')
}

describe('client.getOrderbook', function () {
  let testContext: XrplTestContext

  beforeEach(async () => {
    testContext = await setupClient()
  })
  afterEach(async () => teardownClient(testContext))

  it('normal', async function () {
    testContext.mockRippled!.addResponse('book_offers', normalRippledResponse)
    const request = {
      takerPays: requests.getOrderbook.normal.takerPays,
      takerGets: requests.getOrderbook.normal.takerGets,
      options: {
        limit: 1,
      },
    }
    const response = await testContext.client.getOrderbook(
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
    const invalidOptions = [
      {
        option: 'invalid',
      },
      {
        limit: 'invalid',
      },
      {
        ledger_index: 'invalid',
      },
      {
        ledger_hash: 0,
      },
      {
        taker: 0,
      },
    ]

    testContext.mockRippled!.addResponse('book_offers', normalRippledResponse)
    await Promise.all(
      invalidOptions.map(
        async (invalidOptionObject) =>
          new Promise<void>((resolve) => {
            assertRejects(
              testContext.client
                .getOrderbook(
                  requests.getOrderbook.normal.takerPays,
                  requests.getOrderbook.normal.takerGets,
                  // @ts-expect-error Meant to be invalid for testing purposes
                  invalidOptionObject,
                )
                .catch((error) => {
                  resolve()
                  throw error
                }),
              ValidationError,
            )
          }),
      ),
    )
  })

  it('with XRP', async function () {
    testContext.mockRippled!.addResponse('book_offers', xrpRippledResponse)
    const response = await testContext.client.getOrderbook(
      requests.getOrderbook.withXRP.takerPays,
      requests.getOrderbook.withXRP.takerGets,
    )
    assertResultMatch(response, responses.getOrderbook.withXRP, 'getOrderbook')
  })

  it('sample USD/XRP book has orders sorted correctly', async function () {
    testContext.mockRippled!.addResponse('book_offers', xrpRippledResponse)
    const response = await testContext.client.getOrderbook(
      requests.getOrderbook.withXRP.takerPays,
      requests.getOrderbook.withXRP.takerGets,
    )
    checkSortingOfOrders(response.buy)
    checkSortingOfOrders(response.sell)
  })

  it('sorted so that best deals come first [failure test]', async function () {
    testContext.mockRippled!.addResponse('book_offers', normalRippledResponse)
    const response = await testContext.client.getOrderbook(
      requests.getOrderbook.normal.takerPays,
      requests.getOrderbook.normal.takerGets,
    )
    const buyRates = response.buy.map(async (item) => Number(item.quality))
    const sellRates = response.sell.map(async (item) => Number(item.quality))
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
    testContext.mockRippled!.addResponse('book_offers', xrpRippledResponse)
    const response = await testContext.client.getOrderbook(
      requests.getOrderbook.withXRP.takerPays,
      requests.getOrderbook.withXRP.takerGets,
    )
    const buyRates = response.buy.map(async (item) => Number(item.quality))
    const sellRates = response.sell.map(async (item) => Number(item.quality))
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
    testContext.mockRippled!.addResponse('book_offers', normalRippledResponse)
    const response = await testContext.client.getOrderbook(
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
    testContext.mockRippled!.addResponse('book_offers', normalRippledResponse)
    const LIMIT = 3
    const response = await testContext.client.getOrderbook(
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
