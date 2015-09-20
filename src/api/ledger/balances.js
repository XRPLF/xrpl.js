/* @flow */
'use strict';
const _ = require('lodash');
const async = require('async');
const utils = require('./utils');
const getTrustlines = require('./trustlines');
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;
const convertErrors = utils.common.convertErrors;
import type {Remote} from '../../core/remote';
import type {GetLedgerSequenceCallback} from '../../core/remote';


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
  getTrustlines.call(this, account, options)
    .then(data => callback(null, data))
    .catch(callback);
}

function getLedgerVersionHelper(remote: Remote, optionValue?: number,
  callback: GetLedgerSequenceCallback
) {
  if (optionValue !== undefined && optionValue !== null) {
    callback(null, optionValue);
  } else {
    remote.getLedgerSequence(callback);
  }
}

function getBalancesAsync(account, options, callback) {
  validate.address(account);
  validate.getBalancesOptions(options);

  async.parallel({
    xrp: async.seq(
      _.partial(getLedgerVersionHelper, this.remote, options.ledgerVersion),
      _.partial(utils.getXRPBalance, this.remote, account)
    ),
    trustlines: _.partial(getTrustlinesAsync.bind(this), account, options)
  }, composeAsync(formatBalances, convertErrors(callback)));
}

function getBalances(account: string, options = {}) {
  return utils.promisify(getBalancesAsync).call(this, account, options);
}

module.exports = getBalances;
