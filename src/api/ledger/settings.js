/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const validate = utils.common.validate;
const parseFields = require('./parse/fields');
const composeAsync = utils.common.composeAsync;
const AccountFlags = utils.common.constants.AccountFlags;
const convertErrors = utils.common.convertErrors;

function parseFlags(value) {
  const settings = {};
  for (const flagName in AccountFlags) {
    if (value & AccountFlags[flagName]) {
      settings[flagName] = true;
    }
  }
  return settings;
}

function formatSettings(response) {
  const data = response.account_data;
  const parsedFlags = parseFlags(data.Flags);
  const parsedFields = parseFields(data);
  return _.assign({}, parsedFlags, parsedFields);
}

function getSettingsAsync(account, options, callback) {
  validate.address(account);
  validate.getSettingsOptions(options);

  const request = {
    account: account,
    ledger: options.ledgerVersion || 'validated'
  };

  this.remote.requestAccountInfo(request,
    composeAsync(formatSettings, convertErrors(callback)));
}

function getSettings(account: string, options = {}) {
  return utils.promisify(getSettingsAsync).call(this, account, options);
}

module.exports = getSettings;
