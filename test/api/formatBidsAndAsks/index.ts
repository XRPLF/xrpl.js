import BigNumber from 'bignumber.js'
import assert from 'assert-diff'
import { RippleAPI } from 'ripple-api'
import requests from '../../fixtures/requests'
import responses from '../../fixtures/responses'
import { TestSuite } from '../../utils'

function checkSortingOfOrders(orders) {
  let previousRate = '0'
  for (var i = 0; i < orders.length; i++) {
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
      'Rates must be sorted from least to greatest: ' +
        rate +
        ' should be >= ' +
        previousRate
    )
    previousRate = rate
  }
  return true
}

/**
 * Every test suite exports their tests in the default object.
 * - Check out the "TestSuite" type for documentation on the interface.
 * - Check out "test/api/index.ts" for more information about the test runner.
 */
export default <TestSuite>{
  'normal': async (api, address) => {
    const orderbookInfo = {
      base: {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      },
      counter: {
        currency: 'BTC',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    }

    await Promise.all([
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      }),
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      })
    ]).then(([directOfferResults, reverseOfferResults]) => {
      const directOffers = (directOfferResults
        ? directOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const reverseOffers = (reverseOfferResults
        ? reverseOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [
        ...directOffers,
        ...reverseOffers
      ])
      assert.deepEqual(orderbook, responses.getOrderbook.normal)
    })
  },

  'with XRP': async (api, address) => {
    const orderbookInfo = {
      base: {
        currency: 'USD',
        counterparty: 'rp8rJYTpodf8qbSCHVTNacf8nSW8mRakFw'
      },
      counter: {
        currency: 'XRP'
      }
    }

    await Promise.all([
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      }),
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      })
    ]).then(([directOfferResults, reverseOfferResults]) => {
      const directOffers = (directOfferResults
        ? directOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const reverseOffers = (reverseOfferResults
        ? reverseOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [
        ...directOffers,
        ...reverseOffers
      ])
      assert.deepEqual(orderbook, responses.getOrderbook.withXRP)
    })
  },

  'sample XRP/JPY book has orders sorted correctly': async (api, address) => {
    const orderbookInfo = {
      base: {
        // the first currency in pair
        currency: 'XRP'
      },
      counter: {
        currency: 'JPY',
        counterparty: 'rB3gZey7VWHYRqJHLoHDEJXJ2pEPNieKiS'
      }
    }

    const myAddress = 'rE9qNjzJXpiUbVomdv7R4xhrXVeH2oVmGR'

    await Promise.all([
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        ledger_index: 'validated',
        limit: 400, // must match `test/fixtures/rippled/requests/1-taker_gets-XRP-taker_pays-JPY.json`
        taker: myAddress
      }),
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        ledger_index: 'validated',
        limit: 400, // must match `test/fixtures/rippled/requests/2-taker_gets-JPY-taker_pays-XRP.json`
        taker: myAddress
      })
    ]).then(([directOfferResults, reverseOfferResults]) => {
      const directOffers = (directOfferResults
        ? directOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const reverseOffers = (reverseOfferResults
        ? reverseOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [
        ...directOffers,
        ...reverseOffers
      ])
      assert.deepStrictEqual([], orderbook.bids)
      return checkSortingOfOrders(orderbook.asks)
    })
  },

  'sample USD/XRP book has orders sorted correctly': async (api, address) => {
    const orderbookInfo = {
      counter: { currency: 'XRP' },
      base: {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    }

    const myAddress = 'rE9qNjzJXpiUbVomdv7R4xhrXVeH2oVmGR'

    await Promise.all([
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        ledger_index: 'validated',
        limit: 400, // must match `test/fixtures/rippled/requests/1-taker_gets-XRP-taker_pays-JPY.json`
        taker: myAddress
      }),
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        ledger_index: 'validated',
        limit: 400, // must match `test/fixtures/rippled/requests/2-taker_gets-JPY-taker_pays-XRP.json`
        taker: myAddress
      })
    ]).then(([directOfferResults, reverseOfferResults]) => {
      const directOffers = (directOfferResults
        ? directOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const reverseOffers = (reverseOfferResults
        ? reverseOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [
        ...directOffers,
        ...reverseOffers
      ])
      return (
        checkSortingOfOrders(orderbook.bids) &&
        checkSortingOfOrders(orderbook.asks)
      )
    })
  },

  'sorted so that best deals come first': async (api, address) => {
    const orderbookInfo = {
      base: {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      },
      counter: {
        currency: 'BTC',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    }

    await Promise.all([
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      }),
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      })
    ]).then(([directOfferResults, reverseOfferResults]) => {
      const directOffers = (directOfferResults
        ? directOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const reverseOffers = (reverseOfferResults
        ? reverseOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [
        ...directOffers,
        ...reverseOffers
      ])

      const bidRates = orderbook.bids.map(
        bid => bid.properties.makerExchangeRate
      )
      const askRates = orderbook.asks.map(
        ask => ask.properties.makerExchangeRate
      )
      // makerExchangeRate = quality = takerPays.value/takerGets.value
      // so the best deal for the taker is the lowest makerExchangeRate
      // bids and asks should be sorted so that the best deals come first
      assert.deepEqual(bidRates.map(x => Number(x)).sort(), bidRates)
      assert.deepEqual(askRates.map(x => Number(x)).sort(), askRates)
    })
  },

  'currency & counterparty are correct': async (api, address) => {
    const orderbookInfo = {
      base: {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      },
      counter: {
        currency: 'BTC',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    }

    await Promise.all([
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      }),
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      })
    ]).then(([directOfferResults, reverseOfferResults]) => {
      const directOffers = (directOfferResults
        ? directOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const reverseOffers = (reverseOfferResults
        ? reverseOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [
        ...directOffers,
        ...reverseOffers
      ])

      const orders = [...orderbook.bids, ...orderbook.asks]
      orders.forEach(order => {
        const quantity = order.specification.quantity
        const totalPrice = order.specification.totalPrice
        const { base, counter } = requests.getOrderbook.normal
        assert.strictEqual(quantity.currency, base.currency)
        assert.strictEqual(quantity.counterparty, base.counterparty)
        assert.strictEqual(totalPrice.currency, counter.currency)
        assert.strictEqual(totalPrice.counterparty, counter.counterparty)
      })
    })
  },

  'direction is correct for bids and asks': async (api, address) => {
    const orderbookInfo = {
      base: {
        currency: 'USD',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      },
      counter: {
        currency: 'BTC',
        counterparty: 'rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B'
      }
    }

    await Promise.all([
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      }),
      api.request('book_offers', {
        taker_gets: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.counter),
        taker_pays: RippleAPI.renameCounterpartyToIssuer(orderbookInfo.base),
        ledger_index: 'validated',
        limit: 20,
        taker: address
      })
    ]).then(([directOfferResults, reverseOfferResults]) => {
      const directOffers = (directOfferResults
        ? directOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const reverseOffers = (reverseOfferResults
        ? reverseOfferResults.offers
        : []
      ).reduce((acc, res) => acc.concat(res), [])
      const orderbook = RippleAPI.formatBidsAndAsks(orderbookInfo, [
        ...directOffers,
        ...reverseOffers
      ])

      assert(orderbook.bids.every(bid => bid.specification.direction === 'buy'))
      assert(
        orderbook.asks.every(ask => ask.specification.direction === 'sell')
      )
    })
  }
}
