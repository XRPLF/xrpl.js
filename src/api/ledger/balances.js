/* globals Promise: true */
/* eslint-disable valid-jsdoc */
'use strict';
const utils = require('./utils');
const validator = utils.common.schemaValidator;
const validate = utils.common.validate;

const DefaultPageLimit = 200;

/**
 *  Request the balances for a given account
 *
 *  Notes:
 *  In order to use paging, you must provide at least ledger as a query
 *  parameter.  Additionally, any limit lower than 10 will be bumped up to 10.
 *
 *  @url
 *  @param {RippleAddress} request.params.account
 *          - account to retrieve balances for
 *
 *  @query
 *  @param {String ISO 4217 Currency Code} [request.query.currency]
 *          - only request balances with given currency
 *  @param {RippleAddress} [request.query.counterparty]
 *          - only request balances with given counterparty
 *  @param {String} [request.query.marker] - start position in response paging
 *  @param {Number String} [request.query.limit] - max results per response
 *  @param {Number String} [request.query.ledger] - identifier
 *
 */
function getBalances(account, options, callback) {
  validate.address(account);
  validate.currency(options.currency, true);
  validate.counterparty(options.counterparty, true);
  validate.options(options);

  const self = this;

  const currencyRE = new RegExp(options.currency ?
    ('^' + options.currency.toUpperCase() + '$') : /./);

  function getXRPBalance() {
    const promise = new Promise(function(resolve, reject) {
      const accountInfoRequest = self.remote.requestAccountInfo({
        account: account,
        ledger: utils.parseLedger(options.ledger)
      });

      const lines = [];
      accountInfoRequest.once('error', reject);
      accountInfoRequest.once('success', function(result) {
        lines.push({
          value: utils.common.dropsToXrp(result.account_data.Balance),
          currency: 'XRP',
          counterparty: ''
        });

        result.lines = lines;
        resolve(result);
      });

      accountInfoRequest.request();
    });

    return promise;
  }

  function getLineBalances(prevResult) {
    const isAggregate = options.limit === 'all';
    if (prevResult && (!isAggregate || !prevResult.marker)) {
      return Promise.resolve(prevResult);
    }

    const promise = new Promise(function(resolve, reject) {
      let accountLinesRequest;
      let marker;
      let ledger;
      let limit;

      if (prevResult) {
        marker = prevResult.marker;
        limit = prevResult.limit;
        ledger = prevResult.ledger_index;
      } else {
        marker = options.marker;
        limit = validator.isValid(options.limit, 'UINT32')
          ? Number(options.limit) : DefaultPageLimit;
        ledger = utils.parseLedger(options.ledger);
      }

      accountLinesRequest = self.remote.requestAccountLines({
        account: account,
        marker: marker,
        limit: limit,
        ledger: ledger
      });

      if (options.counterparty) {
        accountLinesRequest.message.peer = options.counterparty;
      }

      accountLinesRequest.once('error', reject);
      accountLinesRequest.once('success', function(nextResult) {
        const lines = [];
        nextResult.lines.forEach(function(line) {
          if (options.frozen && !line.freeze) {
            return;
          }

          if (currencyRE.test(line.currency)) {
            lines.push({
              value: line.balance,
              currency: line.currency,
              counterparty: line.account
            });
          }
        });

        nextResult.lines = prevResult ? prevResult.lines.concat(lines) : lines;
        resolve(nextResult);
      });
      accountLinesRequest.request();
    });

    return promise.then(getLineBalances);
  }

  function getAccountBalances() {
    if (options.counterparty || options.frozen) {
      return getLineBalances();
    }

    if (options.currency) {
      if (options.currency === 'XRP') {
        return getXRPBalance();
      }
      return getLineBalances();
    }

    return Promise.all([getXRPBalance(), getLineBalances()])
    .then(function(values) {
      const xrpBalance = values[0].lines[0];
      const lineBalances = values[1];
      lineBalances.lines.unshift(xrpBalance);
      return Promise.resolve(lineBalances);
    });
  }

  function respondWithBalances(result) {
    let balances = {};

    if (result.marker) {
      balances.marker = result.marker;
    }

    balances.limit = result.limit;
    balances.ledger = result.ledger_index;
    balances.balances = result.lines;

    callback(null, balances);
  }

  getAccountBalances()
  .then(respondWithBalances)
  .catch(callback);
}

module.exports.getBalances = getBalances;
