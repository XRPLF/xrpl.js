/* @flow */
'use strict';
const _ = require('lodash');
const async = require('async');
const utils = require('./utils');
const getTrustlines = require('./trustlines');
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;

function getTrustlineBalanceAmount(trustline) {
  return {
    currency: trustline.specification.currency,
    counterparty: trustline.specification.counterparty,
    value: trustline.state.balance
  };
}

function formatBalances(balances) {
  const xrpBalance = {
    currency: 'XRP',
    value: balances.xrp
  };
  return [xrpBalance].concat(
    balances.trustlines.map(getTrustlineBalanceAmount));
}

function getTrustlinesAsync(account, options, callback) {
  getTrustlines.bind(this)(account, options)
    .then(data => callback(null, data))
    .catch(callback);
}

function getBalancesAsync(account, options, callback) {
  validate.address(account);
  validate.getBalancesOptions(options);

  const ledgerVersion = options.ledgerVersion
                      || this.remote.getLedgerSequence();
  async.parallel({
    xrp: _.partial(utils.getXRPBalance, this.remote, account, ledgerVersion),
    trustlines: _.partial(getTrustlinesAsync.bind(this), account, options)
  }, composeAsync(formatBalances, callback));
}

function getBalances(account: string, options={}) {
  return utils.promisify(getBalancesAsync.bind(this))(account, options);
}

module.exports = getBalances;
