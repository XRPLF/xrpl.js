/* @flow */
'use strict';
const _ = require('lodash');
const deriveKeypair = require('ripple-keypairs').deriveKeypair;
const ValidationError = require('./errors').ValidationError;
const schemaValidate = require('./schema-validator').schemaValidate;

function error(text) {
  return new ValidationError(text);
}

function isValidSecret(secret) {
  try {
    deriveKeypair(secret);
    return true;
  } catch (err) {
    return false;
  }
}

function validateSecret(secret: string): void {
  if (!secret) {
    throw error('Parameter missing: secret');
  }
  if (typeof secret !== 'string' || secret[0] !== 's'
      || !isValidSecret(secret)) {
    throw error('Invalid parameter: secret');
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
  secret: validateSecret,
  currency: _.partial(schemaValidate, 'currency'),
  identifier: _.partial(schemaValidate, 'hash256'),
  ledgerVersion: _.partial(schemaValidate, 'ledgerVersion'),
  sequence: _.partial(schemaValidate, 'sequence'),
  order: _.partial(schemaValidate, 'order'),
  orderbook: _.partial(schemaValidate, 'orderbook'),
  payment: _.partial(schemaValidate, 'payment'),
  suspendedPaymentCreation:
    _.partial(schemaValidate, 'suspended-payment-creation'),
  suspendedPaymentExecution:
    _.partial(schemaValidate, 'suspended-payment-execution'),
  suspendedPaymentCancellation:
    _.partial(schemaValidate, 'suspended-payment-cancellation'),
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
  getBalanceSheetOptions: _.partial(validateOptions, 'balance-sheet-options'),
  getOrdersOptions: _.partial(validateOptions, 'orders-options'),
  getOrderbookOptions: _.partial(validateOptions, 'orders-options'),
  getTransactionOptions: _.partial(validateOptions, 'transaction-options'),
  getLedgerOptions: _.partial(validateOptions, 'ledger-options'),
  options: _.partial(validateOptions, 'options'),
  apiOptions: _.partial(schemaValidate, 'api-options'),
  instructions: _.partial(schemaValidate, 'instructions')
};
