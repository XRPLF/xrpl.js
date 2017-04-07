/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const ValidationError = require('./errors').ValidationError
const schemaValidate = require('./schema-validator').schemaValidate

function error(text) {
  return new ValidationError(text)
}

function validateLedgerRange(options) {
  if (!_.isUndefined(options) && !_.isUndefined(options.minLedgerVersion)
      && !_.isUndefined(options.maxLedgerVersion)) {
    if (Number(options.minLedgerVersion) > Number(options.maxLedgerVersion)) {
      throw error('minLedgerVersion must not be greater than maxLedgerVersion')
    }
  }
}

function validateOptions(schema, instance) {
  schemaValidate(schema, instance)
  validateLedgerRange(instance.options)
}

module.exports = {
  getPaths: _.partial(schemaValidate, 'getPathsParameters'),
  getTransactions: _.partial(validateOptions, 'getTransactionsParameters'),
  getSettings: _.partial(validateOptions, 'getSettingsParameters'),
  getAccountInfo: _.partial(validateOptions, 'getAccountInfoParameters'),
  getTrustlines: _.partial(validateOptions, 'getTrustlinesParameters'),
  getBalances: _.partial(validateOptions, 'getBalancesParameters'),
  getBalanceSheet: _.partial(validateOptions, 'getBalanceSheetParameters'),
  getOrders: _.partial(validateOptions, 'getOrdersParameters'),
  getOrderbook: _.partial(validateOptions, 'getOrderbookParameters'),
  getTransaction: _.partial(validateOptions, 'getTransactionParameters'),
  getPaymentChannel: _.partial(validateOptions, 'getPaymentChannelParameters'),
  getLedger: _.partial(validateOptions, 'getLedgerParameters'),
  preparePayment: _.partial(schemaValidate, 'preparePaymentParameters'),
  prepareOrder: _.partial(schemaValidate, 'prepareOrderParameters'),
  prepareOrderCancellation:
    _.partial(schemaValidate, 'prepareOrderCancellationParameters'),
  prepareTrustline: _.partial(schemaValidate, 'prepareTrustlineParameters'),
  prepareSettings: _.partial(schemaValidate, 'prepareSettingsParameters'),
  prepareEscrowCreation: _.partial(schemaValidate,
    'prepareEscrowCreationParameters'),
  prepareEscrowCancellation: _.partial(schemaValidate,
    'prepareEscrowCancellationParameters'),
  prepareEscrowExecution: _.partial(schemaValidate,
    'prepareEscrowExecutionParameters'),
  preparePaymentChannelCreate: _.partial(schemaValidate,
    'preparePaymentChannelCreateParameters'),
  preparePaymentChannelFund: _.partial(schemaValidate,
    'preparePaymentChannelFundParameters'),
  preparePaymentChannelClaim: _.partial(schemaValidate,
    'preparePaymentChannelClaimParameters'),
  sign: _.partial(schemaValidate, 'signParameters'),
  combine: _.partial(schemaValidate, 'combineParameters'),
  submit: _.partial(schemaValidate, 'submitParameters'),
  computeLedgerHash: _.partial(schemaValidate, 'computeLedgerHashParameters'),
  generateAddress: _.partial(schemaValidate, 'generateAddressParameters'),
  signPaymentChannelClaim: _.partial(schemaValidate,
    'signPaymentChannelClaimParameters'),
  verifyPaymentChannelClaim: _.partial(schemaValidate,
    'verifyPaymentChannelClaimParameters'),
  apiOptions: _.partial(schemaValidate, 'api-options'),
  instructions: _.partial(schemaValidate, 'instructions')
}
