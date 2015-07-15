/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const parseAccountTrustline = require('./parse/account-trustline');

function currencyFilter(currency, trustline) {
  return currency === null || trustline.specification.currency === currency;
}

function getAccountLines(remote, address, ledgerVersion, options, marker, limit,
    callback) {
  const requestOptions = {
    account: address,
    ledger: ledgerVersion,
    marker: marker,
    limit: utils.clamp(limit, 10, 400),
    peer: options.counterparty
  };

  remote.requestAccountLines(requestOptions, (error, data) => {
    return error ? callback(error) :
      callback(null, {
        marker: data.marker,
        results: data.lines.map(parseAccountTrustline)
          .filter(_.partial(currencyFilter, options.currency || null))
      });
  });
}

function getTrustlines(account: string, options: {currency: string,
    counterparty: string, limit: number, ledgerVersion: number},
    callback: () => void): void {
  validate.address(account);
  validate.getTrustlinesOptions(options);

  const ledgerVersion = options.ledgerVersion
                      || this.remote.getLedgerSequence();
  const getter = _.partial(getAccountLines, this.remote, account,
                           ledgerVersion, options);
  utils.getRecursive(getter, options.limit, callback);
}

module.exports = utils.wrapCatch(getTrustlines);
