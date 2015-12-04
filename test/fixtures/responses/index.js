'use strict';

module.exports = {
  generateAddress: require('./generate-address.json'),
  getAccountInfo: require('./get-account-info.json'),
  getBalances: require('./get-balances.json'),
  getBalanceSheet: require('./get-balance-sheet.json'),
  getOrderbook: {
    normal: require('./get-orderbook.json'),
    withXRP: require('./get-orderbook-with-xrp.json')
  },
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
    orderSell: require('./get-transaction-order-sell.json'),
    noMeta: require('./get-transaction-no-meta.json'),
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
    SuspendedPaymentCreationIOU:
      require('./get-transaction-suspended-payment-create-iou.json'),
    suspendedPaymentCancellation:
      require('./get-transaction-suspended-payment-cancellation.json'),
    suspendedPaymentExecution:
      require('./get-transaction-suspended-payment-execution.json'),
    suspendedPaymentExecutionSimple:
      require('./get-transaction-suspended-payment-execution-simple.json')
  },
  getTransactions: {
    normal: require('./get-transactions.json'),
    one: require('./get-transactions-one.json')
  },
  getTrustlines: {
    filtered: require('./get-trustlines.json'),
    all: require('./get-trustlines-all.json')
  },
  getLedger: {
    header: require('./get-ledger'),
    full: require('./get-ledger-full'),
    withSettingsTx: require('./get-ledger-with-settings-tx'),
    withStateAsHashes: require('./get-ledger-with-state-as-hashes')
  },
  prepareOrder: {
    buy: require('./prepare-order.json'),
    sell: require('./prepare-order-sell.json'),
    expiration: require('./prepare-order-expiration')
  },
  prepareOrderCancellation: {
    normal: require('./prepare-order-cancellation.json'),
    withMemos: require('./prepare-order-cancellation-memos.json'),
    noInstructions: require('./prepare-order-cancellation-no-instructions.json')
  },
  preparePayment: {
    normal: require('./prepare-payment.json'),
    minAmountXRP: require('./prepare-payment-min-amount-xrp.json'),
    minAmountXRPXRP: require('./prepare-payment-min-amount-xrp-xrp.json'),
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
    fieldClear: require('./prepare-settings-field-clear.json'),
    noInstructions: require('./prepare-settings-no-instructions.json'),
    signed: require('./prepare-settings-signed.json'),
    noMaxLedgerVersion: require('./prepare-settings-no-maxledgerversion.json')
  },
  prepareSuspendedPaymentCreation: {
    normal: require('./prepare-suspended-payment-creation'),
    full: require('./prepare-suspended-payment-creation-full')
  },
  prepareSuspendedPaymentExecution: {
    normal: require('./prepare-suspended-payment-execution'),
    simple: require('./prepare-suspended-payment-execution-simple')
  },
  prepareSuspendedPaymentCancellation: {
    normal: require('./prepare-suspended-payment-cancellation'),
    memos: require('./prepare-suspended-payment-cancellation-memos')
  },
  prepareTrustline: {
    simple: require('./prepare-trustline-simple.json'),
    frozen: require('./prepare-trustline-frozen.json'),
    complex: require('./prepare-trustline.json')
  },
  sign: {
    normal: require('./sign.json'),
    suspended: require('./sign-suspended.json')
  },
  submit: require('./submit.json'),
  ledgerEvent: require('./ledger-event.json')
};
