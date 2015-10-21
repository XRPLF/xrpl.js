/* @flow */
'use strict';

const _ = require('lodash');
const utils = require('./utils');
const {validate, composeAsync, convertErrors} = utils.common;
import type {Amount} from '../common/types.js';

type BalanceSheetOptions = {
  excludeAddresses?: Array<string>,
  ledgerVersion?: number
}

type GetBalanceSheet = {
  balances?: Array<Amount>,
  assets?: Array<Amount>,
  obligations?: Array<{
     currency: string,
     value: string
   }>
}

function formatBalanceSheet(balanceSheet): GetBalanceSheet {
  const result = {};

  if (!_.isUndefined(balanceSheet.balances)) {
    result.balances = [];
    _.forEach(balanceSheet.balances, (balances, counterparty) => {
      _.forEach(balances, (balance) => {
        result.balances.push(Object.assign({counterparty}, balance));
      });
    });
  }
  if (!_.isUndefined(balanceSheet.assets)) {
    result.assets = [];
    _.forEach(balanceSheet.assets, (assets, counterparty) => {
      _.forEach(assets, (balance) => {
        result.assets.push(Object.assign({counterparty}, balance));
      });
    });
  }
  if (!_.isUndefined(balanceSheet.obligations)) {
    result.obligations = _.map(balanceSheet.obligations, (value, currency) =>
                               ({currency, value}));
  }

  return result;
}

function getBalanceSheetAsync(address: string, options: BalanceSheetOptions,
    callback
) {
  validate.address(address);
  validate.getBalanceSheetOptions(options);

  const request = {
    command: 'gateway_balances',
    account: address,
    strict: true,
    hotwallet: options.excludeAddresses,
    ledger_index: options.ledgerVersion
  };

  const requestCallback = composeAsync(
    formatBalanceSheet, convertErrors(callback));

  this.remote.getLedgerSequence((err, ledgerVersion) => {
    if (err) {
      callback(err);
      return;
    }

    if (_.isUndefined(request.ledger_index)) {
      request.ledger_index = ledgerVersion;
    }

    this.remote.rawRequest(request, requestCallback);
  });
}

function getBalanceSheet(address: string, options: BalanceSheetOptions = {}
): Promise<GetBalanceSheet> {
  return utils.promisify(getBalanceSheetAsync).call(this, address, options);
}

module.exports = getBalanceSheet;
