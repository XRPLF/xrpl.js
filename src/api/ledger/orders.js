/* @flow */
'use strict';
const _ = require('lodash');
const async = require('async');
const utils = require('./utils');
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;
const convertErrors = utils.common.convertErrors;
const parseAccountOrder = require('./parse/account-order');

function requestAccountOffers(remote, address, ledgerVersion, marker, limit,
  callback
) {
  remote.requestAccountOffers({
    account: address,
    marker: marker,
    limit: utils.clamp(limit, 10, 400),
    ledger: ledgerVersion
  },
  composeAsync((data) => ({
    marker: data.marker,
    results: data.offers.map(_.partial(parseAccountOrder, address))
  }), convertErrors(callback)));
}

function getOrdersAsync(account, options, callback) {
  validate.address(account);
  validate.getOrdersOptions(options);

  const getter = _.partial(requestAccountOffers, this.remote, account,
                           options.ledgerVersion);
  utils.getRecursive(getter, options.limit,
    composeAsync((orders) => _.sortBy(orders,
      (order) => order.properties.sequence), callback));
}

function getOrders(account: string, options = {}) {
  return utils.promisify(async.seq(
    utils.getLedgerOptionsWithLedgerVersion,
    getOrdersAsync)).call(this, account, options);
}

module.exports = getOrders;
