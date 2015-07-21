/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;
const parseAccountOrder = require('./parse/account-order');

function requestAccountOffers(remote, address, ledgerVersion, options,
    marker, limit, callback) {
  remote.requestAccountOffers({
    account: address,
    marker: marker,
    limit: utils.clamp(limit, 10, 400),
    ledger: ledgerVersion
  },
  composeAsync((data) => ({
    marker: data.marker,
    results: data.offers.map(_.partial(parseAccountOrder, address))
  }), callback));
}

function getOrders(account, options, callback) {
  validate.address(account);
  validate.getOrdersOptions(options);

  const ledgerVersion = options.ledgerVersion
                      || this.remote.getLedgerSequence();
  const getter = _.partial(requestAccountOffers, this.remote, account,
                           ledgerVersion, options);
  utils.getRecursive(getter, options.limit,
    composeAsync((orders) => _.sortBy(orders,
      (order) => order.properties.sequence), callback));
}

module.exports = utils.wrapCatch(getOrders);
