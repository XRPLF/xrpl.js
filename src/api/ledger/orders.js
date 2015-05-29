/* globals Promise: true */
/* eslint-disable valid-jsdoc */
'use strict';
const _ = require('lodash');
const bignum = require('bignumber.js');
const asyncify = require('simple-asyncify');
const TxToRestConverter = require('./tx-to-rest-converter.js');
const utils = require('./utils');
const ripple = utils.common.core;
const errors = utils.common.errors;
const validate = utils.common.validate;
const validator = utils.common.schemaValidator;

const DefaultPageLimit = 200;

/**
 * Get orders from the ripple network
 *
 *  @query
 *  @param {String} [request.query.limit]
 *    - Set a limit to the number of results returned
 *  @param {String} [request.query.marker]
 *    - Used to paginate results
 *  @param {String} [request.query.ledger]
 *     - The ledger index to query against
 *     - (required if request.query.marker is present)
 *
 *  @url
 *  @param {RippleAddress} request.params.account
 *     - The ripple address to query orders
 *
 */
function getOrders(account, options, callback) {
  const self = this;

  validate.address(account);
  validate.options(options);

  function getAccountOrders(prevResult) {
    const isAggregate = options.limit === 'all';
    if (prevResult && (!isAggregate || !prevResult.marker)) {
      return Promise.resolve(prevResult);
    }

    const promise = new Promise(function(resolve, reject) {
      let accountOrdersRequest;
      let marker;
      let ledger;
      let limit;

      if (prevResult) {
        marker = prevResult.marker;
        limit = prevResult.limit;
        ledger = prevResult.ledger_index;
      } else {
        marker = options.marker;
        limit = validator.isValid(options.limit, 'UINT32') ?
          Number(options.limit) : DefaultPageLimit;
        ledger = utils.parseLedger(options.ledger);
      }

      accountOrdersRequest = self.remote.requestAccountOffers({
        account: account,
        marker: marker,
        limit: limit,
        ledger: ledger
      });

      accountOrdersRequest.once('error', reject);
      accountOrdersRequest.once('success', function(nextResult) {
        nextResult.offers = prevResult ?
          nextResult.offers.concat(prevResult.offers) : nextResult.offers;
        resolve(nextResult);
      });
      accountOrdersRequest.request();
    });

    return promise.then(getAccountOrders);
  }

  function getParsedOrders(offers) {
    return _.reduce(offers, function(orders, off) {
      const sequence = off.seq;
      const type = off.flags & ripple.Remote.flags.offer.Sell ? 'sell' : 'buy';
      const passive = (off.flags & ripple.Remote.flags.offer.Passive) !== 0;

      const taker_gets = utils.parseCurrencyAmount(off.taker_gets);
      const taker_pays = utils.parseCurrencyAmount(off.taker_pays);

      orders.push({
        type: type,
        taker_gets: taker_gets,
        taker_pays: taker_pays,
        sequence: sequence,
        passive: passive
      });

      return orders;
    }, []);
  }

  function respondWithOrders(result) {
    const promise = new Promise(function(resolve) {
      const orders = {};

      if (result.marker) {
        orders.marker = result.marker;
      }

      orders.limit = result.limit;
      orders.ledger = result.ledger_index;
      orders.validated = result.validated;
      orders.orders = getParsedOrders(result.offers);

      resolve(callback(null, orders));
    });

    return promise;
  }

  getAccountOrders()
    .then(respondWithOrders)
    .catch(callback);
}

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
function getOrderBook(account, base, counter, options, callback) {
  const self = this;

  const params = _.merge(options, {
    validated: true,
    order_book: base + '/' + counter,
    base: utils.parseCurrencyQuery(base),
    counter: utils.parseCurrencyQuery(counter)
  });
  validate.address(account);
  validate.orderbook(params);
  validate.options(options);

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

/**
 *  Get an Order transaction (`OfferCreate` or `OfferCancel`)
 *
 *  @url
 *  @param {RippleAddress} request.params.account
 *  @param {String} request.params.identifier
 *
 *  @param {Express.js Request} request
 */
function getOrder(account, identifier, callback) {
  validate.address(account);
  validate.identifier(identifier);

  const txRequest = this.remote.requestTx({
    hash: identifier
  });

  txRequest.once('error', callback);
  txRequest.once('transaction', function(response) {
    if (response.TransactionType !== 'OfferCreate'
        && response.TransactionType !== 'OfferCancel') {
      callback(new errors.InvalidRequestError('Invalid parameter: identifier. '
        + 'The transaction corresponding to the given identifier '
        + 'is not an order'));
    } else {
      const options = {
        account: account,
        identifier: identifier
      };
      asyncify(TxToRestConverter.parseOrderFromTx)(response, options, callback);
    }
  });
  txRequest.request();
}

module.exports = {
  getOrders: getOrders,
  getOrderBook: getOrderBook,
  getOrder: getOrder
};
