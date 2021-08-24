import assert from 'assert-diff'
import responses from '../../fixtures/responses'
import requests from '../../fixtures/requests'
import {TestSuite, assertResultMatch, assertRejects} from '../../testUtils'
// import BigNumber from 'bignumber.js'

// function checkSortingOfOrders(orders) {
//   let previousRate = '0'
//   for (var i = 0; i < orders.length; i++) {
//     const order = orders[i]
//     let rate

//     // We calculate the quality of output/input here as a test.
//     // This won't hold in general because when output and input amounts get tiny,
//     // the quality can differ significantly. However, the offer stays in the
//     // order book where it was originally placed. It would be more consistent
//     // to check the quality from the offer book, but for the test data set,
//     // this calculation holds.

//     if (order.specification.direction === 'buy') {
//       rate = new BigNumber(order.specification.quantity.value)
//         .dividedBy(order.specification.totalPrice.value)
//         .toString()
//     } else {
//       rate = new BigNumber(order.specification.totalPrice.value)
//         .dividedBy(order.specification.quantity.value)
//         .toString()
//     }
//     assert(
//       new BigNumber(rate).isGreaterThanOrEqualTo(previousRate),
//       'Rates must be sorted from least to greatest: ' +
//         rate +
//         ' should be >= ' +
//         previousRate
//     )
//     previousRate = rate
//   }
//   return true
// }

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/client/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'normal': async (client, address) => {
    const response = await client.getOrderbook(
      address,
      requests.getOrderbook.normal,
      {limit: 20}
    )
    assertResultMatch(response, responses.getOrderbook.normal, 'getOrderbook')
  },

  'invalid options': async (client, address) => {
    assertRejects(
      client.getOrderbook(address, requests.getOrderbook.normal, {
        // @ts-ignore
        invalid: 'options'
      }),
      client.errors.ValidationError
    )
  },

  'with XRP': async (client, address) => {
    const response = await client.getOrderbook(
      address,
      requests.getOrderbook.withXRP
    )
    assertResultMatch(response, responses.getOrderbook.withXRP, 'getOrderbook')
  },

  // 'sample XRP/JPY book has orders sorted correctly': async (client, address) => {
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
  //   const response = await client.getOrderbook(myAddress, orderbookInfo)
  //   assert.deepStrictEqual([], response.bids)
  //   checkSortingOfOrders(response.asks)
  // },

  // 'sample USD/XRP book has orders sorted correctly': async (client, address) => {
  //   const orderbookInfo = {
  //     counter: {currency: 'XRP'},
  //     base: {
  //       currency: 'USD',
  //       counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
  //     }
  //   }
  //   const myAddress = 'rE9qNjzJXpiUbVomdv7R4xhrXVeH2oVmGR'
  //   const response = await client.getOrderbook(myAddress, orderbookInfo)
  //   checkSortingOfOrders(response.bids)
  //   checkSortingOfOrders(response.asks)
  // },

  // WARNING: This test fails to catch the sorting bug, issue #766
  'sorted so that best deals come first [bad test]': async (client, address) => {
    const response = await client.getOrderbook(
      address,
      requests.getOrderbook.normal
    )
    const bidRates = response.bids.map(
      (bid) => bid.properties.makerExchangeRate
    )
    const askRates = response.asks.map(
      (ask) => ask.properties.makerExchangeRate
    )
    // makerExchangeRate = quality = takerPays.value/takerGets.value
    // so the best deal for the taker is the lowest makerExchangeRate
    // bids and asks should be sorted so that the best deals come first
    assert.deepEqual(
      bidRates.sort((x) => Number(x)),
      bidRates
    )
    assert.deepEqual(
      askRates.sort((x) => Number(x)),
      askRates
    )
  },

  'currency & counterparty are correct': async (client, address) => {
    const response = await client.getOrderbook(
      address,
      requests.getOrderbook.normal
    )
    ;[...response.bids, ...response.asks].forEach((order) => {
      const quantity = order.specification.quantity
      const totalPrice = order.specification.totalPrice
      const {base, counter} = requests.getOrderbook.normal
      assert.strictEqual(quantity.currency, base.currency)
      assert.strictEqual(quantity.counterparty, base.counterparty)
      assert.strictEqual(totalPrice.currency, counter.currency)
      assert.strictEqual(totalPrice.counterparty, counter.counterparty)
    })
  },

  'direction is correct for bids and asks': async (client, address) => {
    const response = await client.getOrderbook(
      address,
      requests.getOrderbook.normal
    )
    assert(response.bids.every((bid) => bid.specification.direction === 'buy'))
    assert(response.asks.every((ask) => ask.specification.direction === 'sell'))
  }
}
