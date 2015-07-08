'use strict';
const _ = require('lodash');
const utils = require('./utils');
const flags = utils.common.core.Remote.flags.account_root;
const validate = utils.common.validate;
const parseFields = require('./parse/fields');
const composeAsync = utils.common.composeAsync;

const AccountFlags = {
  passwordSpent: flags.PasswordSpent,
  requireDestinationTag: flags.RequireDestTag,
  requireAuthorization: flags.RequireAuth,
  disallowIncomingXRP: flags.DisallowXRP,
  disableMasterKey: flags.DisableMaster,
  noFreeze: flags.NoFreeze,
  globalFreeze: flags.GlobalFreeze,
  defaultRipple: flags.DefaultRipple
};

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

function getSettings(account, options, callback) {
  validate.address(account);
  validate.getSettingsOptions(options);

  const request = {
    account: account,
    ledger: options.ledgerVersion
  };

  this.remote.requestAccountInfo(request,
    composeAsync(formatSettings, callback));
}

module.exports = utils.wrapCatch(getSettings);
