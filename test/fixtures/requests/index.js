'use strict';

module.exports = {
  prepareOrder: {
    buy: require('./prepare-order'),
    sell: require('./prepare-order-sell'),
    expiration: require('./prepare-order-expiration')
  },
  prepareOrderCancellation: require('./prepare-order-cancellation'),
  preparePayment: require('./prepare-payment'),
  preparePaymentAllOptions: require('./prepare-payment-all-options'),
  preparePaymentNoCounterparty: require('./prepare-payment-no-counterparty'),
  prepareSettings: require('./prepare-settings'),
  prepareSuspendedPaymentCreation:
    require('./prepare-suspended-payment-creation'),
  prepareSuspendedPaymentExecution:
    require('./prepare-suspended-payment-execution'),
  prepareSuspendedPaymentCancellation:
    require('./prepare-suspended-payment-cancellation'),
  prepareTrustline: {
    simple: require('./prepare-trustline-simple'),
    complex: require('./prepare-trustline')
  },
  sign: require('./sign'),
  getPaths: {
    normal: require('./getpaths/normal'),
    UsdToUsd: require('./getpaths/usd2usd'),
    XrpToXrp: require('./getpaths/xrp2xrp'),
    XrpToXrpNotEnough: require('./getpaths/xrp2xrp-not-enough'),
    NotAcceptCurrency: require('./getpaths/not-accept-currency'),
    NoPaths: require('./getpaths/no-paths'),
    NoPathsWithCurrencies: require('./getpaths/no-paths-with-currencies'),
    sendAll: require('./getpaths/send-all')
  },
  getOrderbook: require('./get-orderbook'),
  computeLedgerHash: {
    header: require('./compute-ledger-hash'),
    transactions: require('./compute-ledger-hash-transactions')
  }
};
