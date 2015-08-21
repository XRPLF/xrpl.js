/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;
const convertErrors = utils.common.convertErrors;
const parseLedger = require('./parse/ledger');

function getLedgerAsync(options, callback) {
  validate.getLedgerOptions(options);

  const request = {
    ledger: options.ledgerVersion || 'validated',
    expand: options.includeAllData,
    transactions: options.includeTransactions,
    accounts: options.includeState
  };

  this.remote.requestLedger(request,
    composeAsync(response => parseLedger(response.ledger),
    convertErrors(callback)));
}

function getLedger(options = {}) {
  return utils.promisify(getLedgerAsync).call(this, options);
}

module.exports = getLedger;
