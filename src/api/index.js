'use strict';
const ripple = require('./common').core;
const server = require('./server/server');
const connect = server.connect;
// const getServerStatus = server.getServerStatus;
// const getFee = server.getFee;
// const isConnected = server.isConnected;
const getTransaction = require('./ledger/transaction');
const getAccountTransactions = require('./ledger/transactions');
const getTrustlines = require('./ledger/trustlines');
const getBalances = require('./ledger/balances');
// const getPathFind = require('./ledger/pathfind');
// const getOrders = require('./ledger/orders');
// const getOrderBook = require('./ledger/orderbook');
const getSettings = require('./ledger/settings');
const preparePayment = require('./transaction/payment');
const prepareTrustline = require('./transaction/trustline');
const prepareOrder = require('./transaction/order');
const prepareOrderCancellation = require('./transaction/ordercancellation');
const prepareSettings = require('./transaction/settings');
const sign = require('./transaction/sign');
const submit = require('./transaction/submit');
const generateWallet = require('./generate/wallet');
const errors = require('./common').errors;

function RippleAPI(options) {
  this.remote = new ripple.Remote(options);
}

RippleAPI.prototype = {
  connect,
  // getServerStatus,
  // getFee,
  // isConnected,

  getTransaction,
  getAccountTransactions,
  getTrustlines,
  getBalances,
  // getPathFind,
  // getOrders,
  // getOrderBook,
  getSettings,

  preparePayment,
  prepareTrustline,
  prepareOrder,
  prepareOrderCancellation,
  prepareSettings,
  sign,
  submit,

  generateWallet,
  errors
};

module.exports = RippleAPI;
