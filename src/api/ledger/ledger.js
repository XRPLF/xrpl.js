/* @flow */
'use strict';
const utils = require('./utils');
const {validate, composeAsync, convertErrors} = utils.common;
const parseLedger = require('./parse/ledger');
import type {GetLedger} from './types.js';

type LedgerOptions = {
  ledgerVersion?: number,
  includeAllData?: boolean,
  includeTransactions?: boolean,
  includeState?: boolean
}


function getLedgerAsync(options: LedgerOptions, callback) {
  validate.getLedgerOptions(options);

  const request = {
    command: 'ledger',
    ledger_index: options.ledgerVersion || 'validated',
    expand: options.includeAllData,
    transactions: options.includeTransactions,
    accounts: options.includeState
  };

  this.remote.rawRequest(request,
    composeAsync(response => parseLedger(response.ledger),
    convertErrors(callback)));
}

function getLedger(options: LedgerOptions = {}): Promise<GetLedger> {
  return utils.promisify(getLedgerAsync).call(this, options);
}

module.exports = getLedger;
