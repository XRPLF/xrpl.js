'use strict';
const _ = require('lodash');
const utils = require('./utils');
const ripple = utils.common.core;
const validate = utils.common.validate;
const bignum = require('bignumber.js');

/**
 *  Get the most recent spapshot of the order book for a currency pair
 *
 *  @url
 *  @param {RippleAddress} request.params.account
 *      - The ripple address to use as point-of-view
 *        (returns unfunded orders for this account)
 *  @param {String ISO 4217 Currency Code + RippleAddress} request.params.base
 *      - Base currency as currency+issuer
 *  @param {String ISO 4217 Currency Code + RippleAddress}
 *      request.params.counter - Counter currency as currency+issuer
 *
 *  @query
 *  @param {String} [request.query.limit]
 *      - Set a limit to the number of results returned
 *
 *  @param {Express.js Request} request
 */
function getOrderBook(account, orderbook, options, callback) {
  const self = this;
  validate.address(account);
  validate.orderbook(orderbook);
  validate.options(options);

  const params = _.assign({}, orderbook, options, {
    validated: true,
    order_book: orderbook.base + '/' + orderbook.counter
  });

  function getLastValidatedLedger(parameters) {
    const promise = new Promise(function(resolve, reject) {
      const ledgerRequest = self.remote.requestLedger('validated');

      ledgerRequest.once('success', function(res) {
        parameters.ledger = res.ledger.ledger_index;
        resolve(parameters);
      });

      ledgerRequest.once('error', reject);
      ledgerRequest.request();
    });

    return promise;
  }

  function getBookOffers(taker_gets, taker_pays, parameters) {
    const promise = new Promise(function(resolve, reject) {
      const bookOffersRequest = self.remote.requestBookOffers({
        taker_gets: {currency: taker_gets.currency,
                     issuer: taker_gets.counterparty},
        taker_pays: {currency: taker_pays.currency,
                     issuer: taker_pays.counterparty},
        ledger: parameters.ledger,
        limit: parameters.limit,
        taker: account
      });

      bookOffersRequest.once('success', resolve);
      bookOffersRequest.once('error', reject);
      bookOffersRequest.request();
    });

    return promise;
  }

  function getBids(parameters) {
    const taker_gets = parameters.counter;
    const taker_pays = parameters.base;

    return getBookOffers(taker_gets, taker_pays, parameters);
  }

  function getAsks(parameters) {
    const taker_gets = parameters.base;
    const taker_pays = parameters.counter;

    return getBookOffers(taker_gets, taker_pays, parameters);
  }

  function getBidsAndAsks(parameters) {
    return Promise.join(
      getBids(parameters),
      getAsks(parameters),
      function(bids, asks) {
        return [bids, asks, parameters];
      }
    );
  }

  function getParsedBookOffers(offers, isAsk) {
    return offers.reduce(function(orderBook, off) {
      let price;
      const order_maker = off.Account;
      const sequence = off.Sequence;

      // Transaction Flags
      const passive = (off.Flags & ripple.Remote.flags.offer.Passive) !== 0;
      const sell = (off.Flags & ripple.Remote.flags.offer.Sell) !== 0;

      const taker_gets_total = utils.parseCurrencyAmount(off.TakerGets);
      const taker_gets_funded = off.taker_gets_funded ?
        utils.parseCurrencyAmount(off.taker_gets_funded) : taker_gets_total;

      const taker_pays_total = utils.parseCurrencyAmount(off.TakerPays);
      const taker_pays_funded = off.taker_pays_funded ?
        utils.parseCurrencyAmount(off.taker_pays_funded) : taker_pays_total;

      if (isAsk) {
        price = {
          currency: taker_pays_total.currency,
          counterparty: taker_pays_total.counterparty,
          value: bignum(taker_pays_total.value).div(
                        bignum(taker_gets_total.value))
        };
      } else {
        price = {
          currency: taker_gets_total.currency,
          counterparty: taker_gets_total.counterparty,
          value: bignum(taker_gets_total.value).div(
                        bignum(taker_pays_total.value))
        };
      }

      price.value = price.value.toString();

      orderBook.push({
        price: price,
        taker_gets_funded: taker_gets_funded,
        taker_gets_total: taker_gets_total,
        taker_pays_funded: taker_pays_funded,
        taker_pays_total: taker_pays_total,
        order_maker: order_maker,
        sequence: sequence,
        passive: passive,
        sell: sell
      });

      return orderBook;
    }, []);
  }

  function respondWithOrderBook(bids, asks, parameters) {
    const promise = new Promise(function(resolve) {
      const orderBook = {
        order_book: parameters.order_book,
        ledger: parameters.ledger,
        validated: parameters.validated,
        bids: getParsedBookOffers(bids.offers),
        asks: getParsedBookOffers(asks.offers, true)
      };

      resolve(callback(null, orderBook));
    });

    return promise;
  }

  getLastValidatedLedger(params)
  .then(getBidsAndAsks)
  .spread(respondWithOrderBook)
  .catch(callback);
}

module.exports = getOrderBook;
