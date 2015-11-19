'use strict';

module.exports = {
  generateAddress: require('./generate-address.json'),
  getAccountInfo: require('./get-account-info.json'),
  getBalances: require('./get-balances.json'),
  getBalanceSheet: require('./get-balance-sheet.json'),
  getOrderbook: require('./get-orderbook.json'),
  getOrders: require('./get-orders.json'),
  getPaths: {
    XrpToUsd: require('./get-paths.json'),
    UsdToUsd: require('./get-paths-send-usd.json'),
    XrpToXrp: require('./get-paths-xrp-to-xrp.json'),
    sendAll: require('./get-paths-send-all.json')
  },
  getServerInfo: require('./get-server-info.json'),
  getSettings: require('./get-settings.json'),
  getTransaction: {
    orderCancellation: require('./get-transaction-order-cancellation.json'),
    orderWithExpirationCancellation:
      require('./get-transaction-order-with-expiration-cancellation.json'),
    order: require('./get-transaction-order.json'),
    payment: require('./get-transaction-payment.json'),
    settings: require('./get-transaction-settings.json'),
    trustline: require('./get-transaction-trustline-set.json'),
    trackingOn: require('./get-transaction-settings-tracking-on.json'),
    trackingOff: require('./get-transaction-settings-tracking-off.json'),
    setRegularKey: require('./get-transaction-settings-set-regular-key.json'),
    trustlineFrozenOff: require('./get-transaction-trust-set-frozen-off.json'),
    trustlineNoQuality: require('./get-transaction-trust-no-quality.json'),
    notValidated: require('./get-transaction-not-validated.json'),
    suspendedPaymentCreation:
      require('./get-transaction-suspended-payment-create.json'),
    suspendedPaymentCancellation:
      require('./get-transaction-suspended-payment-cancellation.json'),
    suspendedPaymentExecution:
      require('./get-transaction-suspended-payment-execution.json')
  },
  getTransactions: require('./get-transactions.json'),
  getTrustlines: require('./get-trustlines.json'),
  getLedger: {
    header: require('./get-ledger'),
    full: require('./get-ledger-full'),
    withSettingsTx: require('./get-ledger-with-settings-tx')
  },
  prepareOrderCancellation: require('./prepare-order-cancellation.json'),
  prepareOrder: {
    buy: require('./prepare-order.json'),
    sell: require('./prepare-order-sell.json'),
    expiration: require('./prepare-order-expiration')
  },
  preparePayment: {
    normal: require('./prepare-payment.json'),
    allOptions: require('./prepare-payment-all-options.json'),
    noCounterparty: require('./prepare-payment-no-counterparty.json'),
    minAmount: require('./prepare-payment-min-amount.json')
  },
  prepareSettings: {
    regularKey: require('./prepare-settings-regular-key.json'),
    removeRegularKey: require('./prepare-settings-remove-regular-key.json'),
    flags: require('./prepare-settings.json'),
    flagSet: require('./prepare-settings-flag-set.json'),
    flagClear: require('./prepare-settings-flag-clear.json'),
    setTransferRate: require('./prepare-settings-set-transfer-rate.json'),
    fieldClear: require('./prepare-settings-field-clear.json')
  },
  prepareSuspendedPaymentCreation:
    require('./prepare-suspended-payment-creation'),
  prepareSuspendedPaymentExecution:
    require('./prepare-suspended-payment-execution'),
  prepareSuspendedPaymentCancellation:
    require('./prepare-suspended-payment-cancellation'),
  prepareTrustline: {
    simple: require('./prepare-trustline-simple.json'),
    complex: require('./prepare-trustline.json')
  },
  sign: require('./sign.json'),
  signSuspended: require('./sign-suspended.json'),
  submit: require('./submit.json'),
  ledgerClosed: require('./ledger-closed.json')
};
