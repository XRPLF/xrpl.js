/* @flow */

'use strict';
const _ = require('lodash');
const util = require('util');
const EventEmitter = require('events').EventEmitter;
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
const getBalanceSheet = require('./ledger/balance-sheet');
const getPaths = require('./ledger/pathfind');
const getOrders = require('./ledger/orders');
const getOrderbook = require('./ledger/orderbook');
const getSettings = require('./ledger/settings');
const getAccountInfo = require('./ledger/accountinfo');
const preparePayment = require('./transaction/payment');
const prepareTrustline = require('./transaction/trustline');
const prepareOrder = require('./transaction/order');
const prepareOrderCancellation = require('./transaction/ordercancellation');
const prepareSuspendedPaymentCreation =
  require('./transaction/suspended-payment-creation');
const prepareSuspendedPaymentExecution =
  require('./transaction/suspended-payment-execution');
const prepareSuspendedPaymentCancellation =
  require('./transaction/suspended-payment-cancellation');
const prepareSettings = require('./transaction/settings');
const sign = require('./transaction/sign');
const submit = require('./transaction/submit');
const errors = require('./common').errors;
const convertExceptions = require('./common').convertExceptions;
const generateAddress = convertExceptions(common.generateAddress);
const computeLedgerHash = require('./offline/ledgerhash');
const getLedger = require('./ledger/ledger');

function RippleAPI(options: {}) {
  common.validate.remoteOptions(options);
  if (EventEmitter instanceof Function) { // always true, needed for flow
    EventEmitter.call(this);
  }
  const _options = _.assign({}, options, {automatic_resubmission: false});
  this._feeCushion = _options.feeCushion || 1.2;
  this.remote = new common.core.Remote(_options);
  this.remote.on('ledger_closed', message => {
    this.emit('ledgerClosed', server.formatLedgerClose(message));
  });
}

util.inherits(RippleAPI, EventEmitter);

_.assign(RippleAPI.prototype, {
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
  getBalanceSheet,
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
  prepareSuspendedPaymentCreation,
  prepareSuspendedPaymentExecution,
  prepareSuspendedPaymentCancellation,
  prepareSettings,
  sign,
  submit,

  generateAddress,
  errors
});

// these are exposed only for use by unit tests; they are not part of the API
RippleAPI._PRIVATE = {
  common,
  computeLedgerHash,
  ledgerUtils: require('./ledger/utils'),
  schemaValidator: require('./common/schema-validator')
};

module.exports = RippleAPI;
