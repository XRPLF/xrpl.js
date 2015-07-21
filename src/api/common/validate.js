'use strict';
const _ = require('lodash');
const core = require('./utils').core;
const ValidationError = require('./errors').ValidationError;
const schemaValidate = require('./schema-validator');

function error(text) {
  return new ValidationError(text);
}

function validateAddressAndSecret(obj) {
  const address = obj.address;
  const secret = obj.secret;
  schemaValidate('address', address);
  if (!secret) {
    throw error('Parameter missing: secret');
  }
  try {
    if (!core.Seed.from_json(secret).get_key(address)) {
      throw error('secret does not match address');
    }
  } catch (exception) {
    throw error('secret does not match address');
  }
}

function validateLedgerRange(options) {
  if (!_.isUndefined(options.minLedgerVersion)
      && !_.isUndefined(options.maxLedgerVersion)) {
    if (Number(options.minLedgerVersion) > Number(options.maxLedgerVersion)) {
      throw error('minLedgerVersion must not be greater than maxLedgerVersion');
    }
  }
}

function validateOptions(schema, options) {
  schemaValidate(schema, options);
  validateLedgerRange(options);
}

module.exports = {
  address: _.partial(schemaValidate, 'address'),
  addressAndSecret: validateAddressAndSecret,
  currency: _.partial(schemaValidate, 'currency'),
  identifier: _.partial(schemaValidate, 'hash256'),
  sequence: _.partial(schemaValidate, 'sequence'),
  order: _.partial(schemaValidate, 'order'),
  orderbook: _.partial(schemaValidate, 'orderbook'),
  payment: _.partial(schemaValidate, 'payment'),
  pathfind: _.partial(schemaValidate, 'pathfind'),
  settings: _.partial(schemaValidate, 'settings'),
  trustline: _.partial(schemaValidate, 'trustline'),
  txJSON: _.partial(schemaValidate, 'tx'),
  blob: _.partial(schemaValidate, 'blob'),
  getTransactionsOptions: _.partial(validateOptions, 'transactions-options'),
  getSettingsOptions: _.partial(validateOptions, 'settings-options'),
  getAccountInfoOptions: _.partial(validateOptions, 'settings-options'),
  getTrustlinesOptions: _.partial(validateOptions, 'trustlines-options'),
  getBalancesOptions: _.partial(validateOptions, 'trustlines-options'),
  getOrdersOptions: _.partial(validateOptions, 'orders-options'),
  getOrderbookOptions: _.partial(validateOptions, 'orders-options'),
  getTransactionOptions: _.partial(validateOptions, 'transaction-options'),
  options: _.partial(validateOptions, 'options'),
  instructions: _.partial(schemaValidate, 'instructions')
};
