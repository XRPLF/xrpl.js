/* @flow */
'use strict';
const _ = require('lodash');
const utils = require('./utils');
const parseFields = require('./parse/fields');
const {validate, composeAsync, convertErrors} = utils.common;
const AccountFlags = utils.common.constants.AccountFlags;

type SettingsOptions = {
  ledgerVersion?: number
}

type GetSettings = {
  passwordSpent?: boolean,
  requireDestinationTag?: boolean,
  requireAuthorization?: boolean,
  disallowIncomingXRP?: boolean,
  disableMasterKey?: boolean,
  enableTransactionIDTracking?: boolean,
  noFreeze?: boolean,
  globalFreeze?: boolean,
  defaultRipple?: boolean,
  emailHash?: ?string,
  walletLocator?: ?string,
  walletSize?: ?number,
  messageKey?: string,
  domain?: string,
  transferRate?: ?number,
  signers?: string,
  regularKey?: string
}


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

function getSettingsAsync(account: string, options: SettingsOptions, callback) {
  validate.address(account);
  validate.getSettingsOptions(options);

  const request = {
    command: 'account_info',
    account: account,
    ledger_index: options.ledgerVersion || 'validated'
  };

  this.remote.rawRequest(request,
    composeAsync(formatSettings, convertErrors(callback)));
}

function getSettings(account: string, options: SettingsOptions = {}
): Promise<GetSettings> {
  return utils.promisify(getSettingsAsync).call(this, account, options);
}

module.exports = getSettings;
