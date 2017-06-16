'use strict'; // eslint-disable-line

module.exports = {
  submit: {
    success: require('./submit'),
    failure: require('./submit-failed')
  },
  ledger: {
    normal: require('./ledger'),
    notFound: require('./ledger-not-found'),
    withoutCloseTime: require('./ledger-without-close-time'),
    withSettingsTx: require('./ledger-with-settings-tx'),
    withStateAsHashes: require('./ledger-with-state-as-hashes'),
    withPartialPayment: require('./ledger-with-partial-payment'),
    pre2014withPartial: require('./ledger-pre2014-with-partial')
  },
  empty: require('./empty'),
  subscribe: require('./subscribe'),
  unsubscribe: require('./unsubscribe'),
  account_info: {
    normal: require('./account-info'),
    notfound: require('./account-info-not-found')
  },
  account_offers: require('./account-offers'),
  account_tx: {
    normal: require('./account-tx'),
    one: require('./get-transactions-one')
  },
  escrow: require('./escrow'),
  gateway_balances: require('./gateway-balances'),
  book_offers: {
    fabric: require('./book-offers'),
    usd_xrp: require('./book-offers-usd-xrp'),
    xrp_usd: require('./book-offers-xrp-usd')
  },
  ledger_entry: {
    error: require('./ledger-entry-error')
  },
  server_info: {
    normal: require('./server-info'),
    noValidated: require('./server-info-no-validated'),
    syncing: require('./server-info-syncing'),
    error: require('./server-info-error')
  },
  path_find: {
    generate: require('./path-find'),
    sendUSD: require('./path-find-send-usd'),
    sendAll: require('./path-find-send-all'),
    XrpToXrp: require('./path-find-xrp-to-xrp'),
    srcActNotFound: require('./path-find-srcActNotFound'),
    sourceAmountLow: require('./path-find-srcAmtLow')
  },
  payment_channel: {
    normal: require('./payment-channel'),
    full: require('./payment-channel-full')
  },
  tx: {
    Payment: require('./tx/payment.json'),
    AccountSet: require('./tx/account-set.json'),
    AccountSetTrackingOn: require('./tx/account-set-tracking-on.json'),
    AccountSetTrackingOff: require('./tx/account-set-tracking-off.json'),
    RegularKey: require('./tx/set-regular-key.json'),
    OfferCreate: require('./tx/offer-create.json'),
    OfferCreateSell: require('./tx/offer-create-sell.json'),
    OfferCancel: require('./tx/offer-cancel.json'),
    TrustSet: require('./tx/trust-set.json'),
    TrustSetFrozenOff: require('./tx/trust-set-frozen-off.json'),
    TrustSetNoQuality: require('./tx/trust-set-no-quality.json'),
    NotFound: require('./tx/not-found.json'),
    NoLedgerIndex: require('./tx/no-ledger-index.json'),
    NoLedgerFound: require('./tx/no-ledger-found.json'),
    LedgerWithoutTime: require('./tx/ledger-without-time.json'),
    NotValidated: require('./tx/not-validated.json'),
    OfferWithExpiration: require('./tx/order-with-expiration.json'),
    EscrowCreation: require('./tx/escrow-creation.json'),
    EscrowCancellation:
      require('./tx/escrow-cancellation.json'),
    EscrowExecution: require('./tx/escrow-execution.json'),
    EscrowExecutionSimple:
      require('./tx/escrow-execution-simple.json'),
    PaymentChannelCreate: require('./tx/payment-channel-create.json'),
    PaymentChannelFund: require('./tx/payment-channel-fund.json'),
    PaymentChannelClaim: require('./tx/payment-channel-claim.json'),
    Unrecognized: require('./tx/unrecognized.json'),
    NoMeta: require('./tx/no-meta.json'),
    LedgerZero: require('./tx/ledger-zero.json'),
    Amendment: require('./tx/amendment.json'),
    SetFee: require('./tx/set-fee.json')
  }
};
