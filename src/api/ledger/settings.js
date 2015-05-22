/* eslint-disable valid-jsdoc */
'use strict';
const _ = require('lodash');
const TxToRestConverter = require('./tx-to-rest-converter.js');
const utils = require('./utils');
const validate = utils.common.validate;
const constants = utils.common.constants;

function parseFieldsFromResponse(responseBody, fields) {
  let parsedBody = {};

  for (let fieldName in fields) {
    const field = fields[fieldName];
    let value = responseBody[fieldName] || '';
    if (field.encoding === 'hex' && !field.length) {
      value = new Buffer(value, 'hex').toString('ascii');
    }
    parsedBody[field.name] = value;
  }

  return parsedBody;
}

/**
 * Retrieves account settings for a given account
 *
 * @url
 * @param {String} request.params.account
 *
 */
function getSettings(account, callback) {
  validate.address(account);

  this.remote.requestAccountInfo({account: account}, function(error, info) {
    if (error) {
      return callback(error);
    }

    const data = info.account_data;
    const settings = {
      account: data.Account,
      transfer_rate: '0'
    };

    // Attach account flags
    _.extend(settings, TxToRestConverter.parseFlagsFromResponse(data.Flags,
      constants.AccountRootFlags));

    // Attach account fields
    _.extend(settings, parseFieldsFromResponse(data,
      constants.AccountRootFields));

    settings.transaction_sequence = String(settings.transaction_sequence);

    callback(null, {settings: settings});
  });
}

module.exports = {
  getSettings: getSettings
};
