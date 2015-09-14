/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;
const convertErrors = utils.common.convertErrors;
const parseAccountTrustline = require('./parse/account-trustline');

function currencyFilter(currency, trustline) {
  return currency === null || trustline.specification.currency === currency;
}

function formatResponse(options, data) {
  return {
    marker: data.marker,
    results: data.lines.map(parseAccountTrustline)
      .filter(_.partial(currencyFilter, options.currency || null))
  };
}

function getAccountLines(remote, address, ledgerVersion, options, marker, limit,
    callback
) {
  const requestOptions = {
    account: address,
    ledger: ledgerVersion,
    marker: marker,
    limit: utils.clamp(limit, 10, 400),
    peer: options.counterparty
  };

  remote.requestAccountLines(requestOptions,
    composeAsync(_.partial(formatResponse, options),
      convertErrors(callback)));
}

function getTrustlinesAsync(account: string, options: {currency: string,
    counterparty: string, limit: number, ledgerVersion: number},
    callback: () => void
): void {
  validate.address(account);
  validate.getTrustlinesOptions(options);

  if (!options.ledgerVersion) {
    const self = this;
    this.remote.getLedgerSequence(convertErrors(function(err?, seq: number) {
      if (err) {
        callback(err);
      } else {
        const newOptions = _.extend(options, {ledgerVersion: seq});
        getTrustlinesAsync.call(self, account, newOptions, callback);
      }
    }));
    return;
  }

  const getter = _.partial(getAccountLines, this.remote, account,
                           options.ledgerVersion, options);
  utils.getRecursive(getter, options.limit, callback);
}

function getTrustlines(account: string, options = {}) {
  return utils.promisify(getTrustlinesAsync).call(this, account, options);
}

module.exports = getTrustlines;
