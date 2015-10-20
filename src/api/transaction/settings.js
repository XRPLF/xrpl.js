/* @flow */
'use strict';
const assert = require('assert');
const BigNumber = require('bignumber.js');
const utils = require('./utils');
const validate = utils.common.validate;
const AccountFlagIndices = utils.common.constants.AccountFlagIndices;
const AccountFields = utils.common.constants.AccountFields;
const Transaction = utils.common.core.Transaction;
import type {Instructions, Prepare} from './types.js';
import type {Settings} from './settings-types.js';

// Emptry string passed to setting will clear it
const CLEAR_SETTING = null;


function setTransactionFlags(transaction: Transaction, values: Settings) {
  const keys = Object.keys(values);
  assert(keys.length === 1, 'ERROR: can only set one setting per transaction');
  const flagName = keys[0];
  const value = values[flagName];
  const index = AccountFlagIndices[flagName];
  if (index !== undefined) {
    if (value) {
      transaction.tx_json.SetFlag = index;
    } else {
      transaction.tx_json.ClearFlag = index;
    }
  }
}

function setTransactionFields(transaction: Transaction, input: Settings) {
  const fieldSchema = AccountFields;
  for (const fieldName in fieldSchema) {
    const field = fieldSchema[fieldName];
    let value = input[field.name];

    if (value === undefined) {
      continue;
    }

    // The value required to clear an account root field varies
    if (value === CLEAR_SETTING && field.hasOwnProperty('defaults')) {
      value = field.defaults;
    }

    if (field.encoding === 'hex' && !field.length) {
      // This is currently only used for Domain field
      value = new Buffer(value, 'ascii').toString('hex').toUpperCase();
    }

    transaction.tx_json[fieldName] = value;
  }
}

/**
 *  Note: A fee of 1% requires 101% of the destination to be sent for the
 *        destination to receive 100%.
 *  The transfer rate is specified as the input amount as fraction of 1.
 *  To specify the default rate of 0%, a 100% input amount, specify 1.
 *  To specify a rate of 1%, a 101% input amount, specify 1.01
 *
 *  @param {Number|String} transferRate
 *
 *  @returns {Number|String} numbers will be converted while strings
 *                           are returned
 */

function convertTransferRate(transferRate: number | string): number | string {
  return (new BigNumber(transferRate)).shift(9).toNumber();
}

function createSettingsTransaction(account: string, settings: Settings
): Transaction {
  validate.address(account);
  validate.settings(settings);

  const transaction = new Transaction();
  if (settings.regularKey) {
    return transaction.setRegularKey({
      account: account,
      regular_key: settings.regularKey
    });
  }

  transaction.accountSet(account);
  setTransactionFlags(transaction, settings);
  setTransactionFields(transaction, settings);

  if (transaction.tx_json.TransferRate !== undefined) {
    transaction.tx_json.TransferRate = convertTransferRate(
      transaction.tx_json.TransferRate);
  }
  return transaction;
}

function prepareSettingsAsync(account: string, settings: Settings,
    instructions: Instructions, callback
) {
  const txJSON = createSettingsTransaction(account, settings).tx_json;
  utils.prepareTransaction(txJSON, this.remote, instructions, callback);
}

function prepareSettings(account: string, settings: Object,
    instructions: Instructions = {}
): Promise<Prepare> {
  return utils.promisify(prepareSettingsAsync.bind(this))(
    account, settings, instructions);
}

module.exports = prepareSettings;
