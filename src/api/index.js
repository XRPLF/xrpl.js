/* @flow */

'use strict';
const _ = require('lodash');
const common = require('./common');
const server = require('./server/server');
const connect = server.connect;
const disconnect = server.disconnect;
const getServerInfo = server.getServerInfo;
const getFee = server.getFee;
const isConnected = server.isConnected;
const getLedgerVersion = server.getLedgerVersion;
const getTransaction = require('./ledger/transaction');
const getTransactions = require('./ledger/transactions');
const getTrustlines = require('./ledger/trustlines');
const getBalances = require('./ledger/balances');
const getPaths = require('./ledger/pathfind');
const getOrders = require('./ledger/orders');
const getOrderbook = require('./ledger/orderbook');
const getSettings = require('./ledger/settings');
const getAccountInfo = require('./ledger/accountinfo');
const preparePayment = require('./transaction/payment');
const prepareTrustline = require('./transaction/trustline');
const prepareOrder = require('./transaction/order');
const prepareOrderCancellation = require('./transaction/ordercancellation');
const prepareSettings = require('./transaction/settings');
const sign = require('./transaction/sign');
const submit = require('./transaction/submit');
const errors = require('./common').errors;
const convertExceptions = require('./common').convertExceptions;
const generateAddress = convertExceptions(common.generateAddress);
const computeLedgerHash = require('./offline/ledgerhash');
const getLedger = require('./ledger/ledger');
const isValidAddress = common.isValidAddress;

function RippleAPI(options: {}) {
  common.validate.remoteOptions(options);
  const _options = _.assign({}, options, {automatic_resubmission: false});
  this.remote = new common.core.Remote(_options);
}

RippleAPI.prototype = {
  connect,
  disconnect,
  isConnected,
  getServerInfo,
  getFee,
  getLedgerVersion,

  getTransaction,
  getTransactions,
  getTrustlines,
  getBalances,
  getPaths,
  getOrders,
  getOrderbook,
  getSettings,
  getAccountInfo,
  getLedger,

  preparePayment,
  prepareTrustline,
  prepareOrder,
  prepareOrderCancellation,
  prepareSettings,
  sign,
  submit,

  computeLedgerHash,
  isValidAddress,
  generateAddress,
  errors
};

// these are exposed only for use by unit tests; they are not part of the API
RippleAPI._PRIVATE = {
  common: common,
  ledgerUtils: require('./ledger/utils'),
  schemaValidator: require('./common/schema-validator')
};

module.exports = RippleAPI;
