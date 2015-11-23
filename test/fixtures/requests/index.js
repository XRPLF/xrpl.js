'use strict';

module.exports = {
  prepareOrder: {
    buy: require('./prepare-order'),
    sell: require('./prepare-order-sell'),
    expiration: require('./prepare-order-expiration')
  },
  prepareOrderCancellation: require('./prepare-order-cancellation'),
  preparePayment: require('./prepare-payment'),
  preparePaymentMinAmountXRP: require('./prepare-payment-min-xrp'),
  preparePaymentMinAmount: require('./prepare-payment-min'),
  preparePaymentWrongAddress: require('./prepare-payment-wrong-address'),
  preparePaymentWrongAmount: require('./prepare-payment-wrong-amount'),
  preparePaymentWrongPartial: require('./prepare-payment-wrong-partial'),
  preparePaymentAllOptions: require('./prepare-payment-all-options'),
  preparePaymentNoCounterparty: require('./prepare-payment-no-counterparty'),
  prepareSettings: require('./prepare-settings'),
  prepareSuspendedPaymentCreation:
    require('./prepare-suspended-payment-creation'),
  prepareSuspendedPaymentCreationFull:
    require('./prepare-suspended-payment-creation-full'),
  prepareSuspendedPaymentExecution:
    require('./prepare-suspended-payment-execution'),
  prepareSuspendedPaymentExecutionSimple:
    require('./prepare-suspended-payment-execution-simple'),
  prepareSuspendedPaymentCancellation:
    require('./prepare-suspended-payment-cancellation'),
  prepareSuspendedPaymentCancellationMemos:
    require('./prepare-suspended-payment-cancellation-memos'),
  prepareTrustline: {
    simple: require('./prepare-trustline-simple'),
    complex: require('./prepare-trustline'),
    frozen: require('./prepare-trustline-frozen.json')
  },
  sign: require('./sign'),
  signSuspended: require('./sign-suspended.json'),
  getPaths: {
    normal: require('./getpaths/normal'),
    UsdToUsd: require('./getpaths/usd2usd'),
    XrpToXrp: require('./getpaths/xrp2xrp'),
    XrpToXrpNotEnough: require('./getpaths/xrp2xrp-not-enough'),
    NotAcceptCurrency: require('./getpaths/not-accept-currency'),
    NoPaths: require('./getpaths/no-paths'),
    NoPathsWithCurrencies: require('./getpaths/no-paths-with-currencies'),
    sendAll: require('./getpaths/send-all'),
    invalid: require('./getpaths/invalid'),
    issuer: require('./getpaths/issuer')
  },
  getOrderbook: require('./get-orderbook'),
  getOrderbookWithXRP: require('./get-orderbook-with-xrp'),
  computeLedgerHash: {
    header: require('./compute-ledger-hash'),
    transactions: require('./compute-ledger-hash-transactions')
  }
};
