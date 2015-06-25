/* eslint-disable valid-jsdoc */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const ripple = utils.common.core;
const validate = utils.common.validate;

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
    const isAggregate = options.limit === undefined;
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
        limit = options.limit || DefaultPageLimit;
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

module.exports = getOrders;
