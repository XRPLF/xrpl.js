'use strict'; // eslint-disable-line strict

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
  getPaymentChannel: {
    normal: require('./get-payment-channel.json'),
    full: require('./get-payment-channel-full.json')
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
    escrowCreation:
      require('./get-transaction-escrow-create.json'),
    escrowCancellation:
      require('./get-transaction-escrow-cancellation.json'),
    escrowExecution:
      require('./get-transaction-escrow-execution.json'),
    escrowExecutionSimple:
      require('./get-transaction-escrow-execution-simple.json'),
    paymentChannelCreate:
      require('./get-transaction-payment-channel-create.json'),
    paymentChannelFund:
      require('./get-transaction-payment-channel-fund.json'),
    paymentChannelClaim:
      require('./get-transaction-payment-channel-claim.json'),
    amendment: require('./get-transaction-amendment.json'),
    feeUpdate: require('./get-transaction-fee-update.json')
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
    withStateAsHashes: require('./get-ledger-with-state-as-hashes'),
    withPartial: require('./get-ledger-with-partial-payment'),
    pre2014withPartial: require('./get-ledger-pre2014-with-partial')
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
    flagsMultisign: require('./prepare-settings-multisign.json'),
    flagSet: require('./prepare-settings-flag-set.json'),
    flagClear: require('./prepare-settings-flag-clear.json'),
    setTransferRate: require('./prepare-settings-set-transfer-rate.json'),
    fieldClear: require('./prepare-settings-field-clear.json'),
    noInstructions: require('./prepare-settings-no-instructions.json'),
    signed: require('./prepare-settings-signed.json'),
    noMaxLedgerVersion: require('./prepare-settings-no-maxledgerversion.json'),
    signers: require('./prepare-settings-signers.json')
  },
  prepareEscrowCreation: {
    normal: require('./prepare-escrow-creation'),
    full: require('./prepare-escrow-creation-full')
  },
  prepareEscrowExecution: {
    normal: require('./prepare-escrow-execution'),
    simple: require('./prepare-escrow-execution-simple')
  },
  prepareEscrowCancellation: {
    normal: require('./prepare-escrow-cancellation'),
    memos: require('./prepare-escrow-cancellation-memos')
  },
  preparePaymentChannelCreate: {
    normal: require('./prepare-payment-channel-create'),
    full: require('./prepare-payment-channel-create-full')
  },
  preparePaymentChannelFund: {
    normal: require('./prepare-payment-channel-fund'),
    full: require('./prepare-payment-channel-fund-full')
  },
  preparePaymentChannelClaim: {
    normal: require('./prepare-payment-channel-claim'),
    renew: require('./prepare-payment-channel-claim-renew'),
    close: require('./prepare-payment-channel-claim-close')
  },
  prepareTrustline: {
    simple: require('./prepare-trustline-simple.json'),
    frozen: require('./prepare-trustline-frozen.json'),
    complex: require('./prepare-trustline.json')
  },
  sign: {
    normal: require('./sign.json'),
    escrow: require('./sign-escrow.json'),
    signAs: require('./sign-as')
  },
  signPaymentChannelClaim: require('./sign-payment-channel-claim'),
  combine: {
    single: require('./combine.json')
  },
  submit: require('./submit.json'),
  ledgerEvent: require('./ledger-event.json')
};
