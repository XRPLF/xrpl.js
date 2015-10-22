/* @flow */
'use strict';
const _ = require('lodash');
const async = require('async');
const utils = require('./utils');
const {validate, composeAsync, convertErrors} = utils.common;
const parseAccountTrustline = require('./parse/account-trustline');

import type {Remote} from '../../core/remote';
import type {TrustlinesOptions, Trustline} from './trustlines-types.js';


type GetTrustlinesResponse = Array<Trustline>

function currencyFilter(currency: string, trustline: Trustline) {
  return currency === null || trustline.specification.currency === currency;
}

function formatResponse(options: TrustlinesOptions, data) {
  return {
    marker: data.marker,
    results: data.lines.map(parseAccountTrustline)
      .filter(_.partial(currencyFilter, options.currency || null))
  };
}

function getAccountLines(remote: Remote, address: string, ledgerVersion: number,
  options: TrustlinesOptions, marker: string, limit: number, callback
) {
  const request = {
    command: 'account_lines',
    account: address,
    ledger_index: ledgerVersion,
    marker: marker,
    limit: utils.clamp(limit, 10, 400),
    peer: options.counterparty
  };

  remote.rawRequest(request,
    composeAsync(_.partial(formatResponse, options),
      convertErrors(callback)));
}

function getTrustlinesAsync(account: string, options: TrustlinesOptions,
    callback: () => void
): void {
  validate.address(account);
  validate.getTrustlinesOptions(options);

  const getter = _.partial(getAccountLines, this.remote, account,
                           options.ledgerVersion, options);
  utils.getRecursive(getter, options.limit, callback);
}

function getTrustlines(account: string, options: TrustlinesOptions = {}
): Promise<GetTrustlinesResponse> {
  return utils.promisify(async.seq(
    utils.getLedgerOptionsWithLedgerVersion,
    getTrustlinesAsync)).call(this, account, options);
}

module.exports = getTrustlines;
