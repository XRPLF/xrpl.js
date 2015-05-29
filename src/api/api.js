'use strict';
const ripple = require('./common').core;
const generateWallet = require('./generate/wallet');
const server = require('./server/server');
const balances = require('./ledger/balances');
const settings = require('./ledger/settings');
const transactions = require('./ledger/transactions');
const trustlines = require('./ledger/trustlines');
const notifications = require('./ledger/notifications');
const payments = require('./ledger/payments');
const orders = require('./ledger/orders');
const preparePayment = require('./transaction/payment');
const prepareOrder = require('./transaction/order');
const prepareOrderCancellation = require('./transaction/ordercancellation');
const prepareTrustline = require('./transaction/trustline');
const prepareSettings = require('./transaction/settings');
const sign = require('./transaction/sign');
const submit = require('./transaction/submit');
const errors = require('./common').errors;

function RippleAPI(options) {
  this.remote = new ripple.Remote(options);
}

RippleAPI.prototype = {
  generateWallet: generateWallet,

  connect: server.connect,
  getServerStatus: server.getServerStatus,
  getFee: server.getFee,
  isConnected: server.isConnected,

  getBalances: balances.getBalances,
  getPayment: payments.getPayment,
  getAccountPayments: payments.getAccountPayments,
  getPathFind: payments.getPathFind,
  getTrustlines: trustlines.getTrustlines,
  getOrder: orders.getOrder,
  getOrders: orders.getOrders,
  getOrderBook: orders.getOrderBook,
  getSettings: settings.getSettings,
  getTransaction: transactions.getTransaction,
  getNotification: notifications.getNotification,
  getNotifications: notifications.getNotifications,

  preparePayment: preparePayment,
  prepareTrustline: prepareTrustline,
  prepareOrder: prepareOrder,
  prepareOrderCancellation: prepareOrderCancellation,
  prepareSettings: prepareSettings,
  sign: sign,
  submit: submit,

  errors: errors
};

module.exports = RippleAPI;
