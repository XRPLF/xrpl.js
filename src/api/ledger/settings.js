'use strict';
const _ = require('lodash');
const utils = require('./utils');
const flags = utils.common.core.Remote.flags.account_root;
const validate = utils.common.validate;
const parseFields = require('./parse/fields');

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

function getSettings(account, callback) {
  validate.address(account);

  this.remote.requestAccountInfo({account: account}, function(error, info) {
    if (error) {
      return callback(error);
    }
    const data = info.account_data;
    const parsedFlags = parseFlags(data.Flags);
    const parsedFields = parseFields(data);
    const settings = _.assign({}, parsedFlags, parsedFields);
    callback(null, settings);
  });
}

module.exports = utils.wrapCatch(getSettings);
