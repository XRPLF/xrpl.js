'use strict';

module.exports = {
  generateWallet: require('./generate-wallet.json'),
  getAccountInfo: require('./get-account-info.json'),
  getBalances: require('./get-balances.json'),
  getOrderbook: require('./get-orderbook.json'),
  getOrders: require('./get-orders.json'),
  getPaths: require('./get-paths.json'),
  getServerInfo: require('./get-server-info.json'),
  getSettings: require('./get-settings.json'),
  getTransaction: {
    orderCancellation: require('./get-transaction-order-cancellation.json'),
    order: require('./get-transaction-order.json'),
    payment: require('./get-transaction-payment.json'),
    settings: require('./get-transaction-settings.json')
  },
  getTransactions: require('./get-transactions.json'),
  getTrustlines: require('./get-trustlines.json'),
  prepareOrderCancellation: require('./prepare-order-cancellation.json'),
  prepareOrder: require('./prepare-order.json'),
  preparePayment: require('./prepare-payment.json'),
  prepareSettings: {
    regularKey: require('./prepare-settings-regular-key.json'),
    flags: require('./prepare-settings.json')
  },
  prepareTrustline: require('./prepare-trustline.json'),
  sign: require('./sign.json'),
  submit: require('./submit.json')
};
