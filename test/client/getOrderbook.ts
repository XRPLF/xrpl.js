// import BigNumber from "bignumber.js";
// import { assert } from "chai";

import { assert } from 'chai'

import { BookOffersRequest } from '../../src'
import requests from '../fixtures/requests'
import responses from '../fixtures/responses'
import rippled from '../fixtures/rippled'
import { setupClient, teardownClient } from '../setupClient'
import { addressTests } from '../testUtils'

// function checkSortingOfOrders(orders) {
//   let previousRate = "0";
//   for (let i = 0; i < orders.length; i++) {
//     const order = orders[i];
//     let rate;

//     // We calculate the quality of output/input here as a test.
//     // This won't hold in general because when output and input amounts get tiny,
//     // the quality can differ significantly. However, the offer stays in the
//     // order book where it was originally placed. It would be more consistent
//     // to check the quality from the offer book, but for the test data set,
//     // this calculation holds.

//     if (order.specification.direction === "buy") {
//       rate = new BigNumber(order.specification.quantity.value)
//         .dividedBy(order.specification.totalPrice.value)
//         .toString();
//     } else {
//       rate = new BigNumber(order.specification.totalPrice.value)
//         .dividedBy(order.specification.quantity.value)
//         .toString();
//     }
//     assert(
//       new BigNumber(rate).isGreaterThanOrEqualTo(previousRate),
//       `Rates must be sorted from least to greatest: ${rate} should be >= ${previousRate}`
//     );
//     previousRate = rate;
//   }
//   return true;
// }

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

// function xrpRippledResponse(
//   request: BookOffersRequest,
// ): Record<string, unknown> {
//   if (request.taker_pays.issuer === 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw') {
//     return rippled.book_offers.xrp_usd
//   }
//   if (request.taker_gets.issuer === 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw') {
//     return rippled.book_offers.usd_xrp
//   }
//   throw new Error('unexpected end')
// }

describe('client.getOrderbook', function () {
  beforeEach(setupClient)
  afterEach(teardownClient)

  addressTests.forEach(function (testcase) {
    describe(testcase.type, function () {
      it('normal', async function () {
        this.mockRippled.addResponse('book_offers', normalRippledResponse)
        const response = await this.client.getOrderbook(
          requests.getOrderbook.normal.taker_pays,
          requests.getOrderbook.normal.taker_gets,
          { limit: 1 },
        )
        assert.deepEqual(response, responses.getOrderbook.normal)
      })

      // it('invalid options', async function () {
      //   this.mockRippled.addResponse('book_offers', normalRippledResponse)
      //   assertRejects(
      //     this.client.getOrderbook(
      //       testcase.address,
      //       requests.getOrderbook.normal,
      //       {
      //         invalid: 'options',
      //       },
      //     ),
      //     this.client.errors.ValidationError,
      //   )
      // })
      // it('with XRP', async function () {
      //   this.mockRippled.addResponse('book_offers', xrpRippledResponse)
      //   const response = await this.client.getOrderbook(
      //     testcase.address,
      //     requests.getOrderbook.withXRP,
      //   )
      //   assertResultMatch(
      //     response,
      //     responses.getOrderbook.withXRP,
      //     'getOrderbook',
      //   )
      // })
      // 'sample XRP/JPY book has orders sorted correctly', async function () {
      //   const orderbookInfo = {
      //     base: {
      //       // the first currency in pair
      //       currency: 'XRP'
      //     },
      //     counter: {
      //       currency: 'JPY',
      //       counterparty: 'rB3gZey7VWHYRqJHLoHDEJXJ2pEPNieKiS'
      //     }
      //   }
      //   const myAddress = 'rE9qNjzJXpiUbVomdv7R4xhrXVeH2oVmGR'
      //   const response = await this.client.getOrderbook(myAddress, orderbookInfo)
      //   assert.deepStrictEqual([], response.bids)
      //   checkSortingOfOrders(response.asks)
      // },
      // 'sample USD/XRP book has orders sorted correctly', async function () {
      //   const orderbookInfo = {
      //     counter: {currency: 'XRP'},
      //     base: {
      //       currency: 'USD',
      //       counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      //     }
      //   }
      //   const myAddress = 'rE9qNjzJXpiUbVomdv7R4xhrXVeH2oVmGR'
      //   const response = await this.client.getOrderbook(myAddress, orderbookInfo)
      //   checkSortingOfOrders(response.bids)
      //   checkSortingOfOrders(response.asks)
      // },
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
      // it("currency & counterparty are correct", async function () {
      //   this.mockRippled.addResponse("book_offers", normalRippledResponse);
      //   const response = await this.client.getOrderbook(
      //     test.address,
      //     requests.getOrderbook.normal
      //   );
      //   [...response.bids, ...response.asks].forEach((order) => {
      //     const quantity = order.specification.quantity;
      //     const totalPrice = order.specification.totalPrice;
      //     const { base, counter } = requests.getOrderbook.normal;
      //     assert.strictEqual(quantity.currency, base.currency);
      //     assert.strictEqual(quantity.counterparty, base.counterparty);
      //     assert.strictEqual(totalPrice.currency, counter.currency);
      //     assert.strictEqual(totalPrice.counterparty, counter.counterparty);
      //   });
      // });
      // it("direction is correct for bids and asks", async function () {
      //   this.mockRippled.addResponse("book_offers", normalRippledResponse);
      //   const response = await this.client.getOrderbook(
      //     test.address,
      //     requests.getOrderbook.normal
      //   );
      //   assert(
      //     response.bids.every((bid) => bid.specification.direction === "buy")
      //   );
      //   assert(
      //     response.asks.every((ask) => ask.specification.direction === "sell")
      //   );
      // });
    })
  })
})
