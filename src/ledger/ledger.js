/* @flow */
'use strict';
const utils = require('./utils');
const {validate} = utils.common;
const parseLedger = require('./parse/ledger');
import type {GetLedger} from './types.js';

type LedgerOptions = {
  ledgerVersion?: number,
  includeAllData?: boolean,
  includeTransactions?: boolean,
  includeState?: boolean
}


function getLedger(options: LedgerOptions = {}): Promise<GetLedger> {
  validate.getLedgerOptions(options);

  const request = {
    command: 'ledger',
    ledger_index: options.ledgerVersion || 'validated',
    expand: options.includeAllData,
    transactions: options.includeTransactions,
    accounts: options.includeState
  };

  return this.connection.request(request).then(response =>
    parseLedger(response.ledger));
}

module.exports = getLedger;
