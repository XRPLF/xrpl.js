'use strict';
const _ = require('lodash');
const ValidationError = require('./errors').ValidationError;
const schemaValidate = require('./schema-validator');
const ripple = require('./core');

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
    if (!ripple.Seed.from_json(secret).get_key(address)) {
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

function validateOptions(options) {
  schemaValidate('options', options);
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
  options: validateOptions,
  instructions: _.partial(schemaValidate, 'instructions')
};
