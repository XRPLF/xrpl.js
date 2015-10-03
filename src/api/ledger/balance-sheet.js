'use strict';

const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;
const convertErrors = utils.common.convertErrors;

function formatBalanceSheet({balances, obligations, assets}) {
  const result = {};

  if (!_.isUndefined(balances)) {
    result.balances = Object.keys(balances).map((k) => {
      return {
        counterparty: k,
        balances: balances[k]
      };
    });
  }
  if (!_.isUndefined(assets)) {
    result.assets = Object.keys(assets).map((k) => {
      return {
        counterparty: k,
        assets: assets[k]
      };
    });
  }
  if (!_.isUndefined(obligations)) {
    result.obligations = Object.keys(obligations).map((k) => {
      return {currency: k, value: obligations[k]};
    });
  }

  return result;
}

function getBalanceSheetAsync(address, options, callback) {
  validate.address(address);
  validate.getBalanceSheetOptions(options);

  const requestOptions = Object.assign({}, {
    account: address,
    strict: true,
    hotwallet: options.excludeAddresses,
    ledger: options.ledgerVersion
  });

  const requestCallback = composeAsync(
    formatBalanceSheet, convertErrors(callback));

  this.remote.getLedgerSequence((err, ledgerVersion) => {
    if (err) {
      callback(err);
      return;
    }

    if (_.isUndefined(requestOptions.ledger)) {
      requestOptions.ledger = ledgerVersion;
    }

    this.remote.requestGatewayBalances(requestOptions, requestCallback);
  });
}

function getBalanceSheet(address: string, options = {}) {
  return utils.promisify(getBalanceSheetAsync).call(this, address, options);
}

module.exports = getBalanceSheet;
