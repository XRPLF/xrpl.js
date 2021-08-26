'use strict'; // eslint-disable-line

module.exports = {
  submit: {
    success: require('./submit'),
    failure: require('./submitFailed')
  },
  ledger: {
    normal: require('./ledger'),
    normalByHash: require('./ledgerByHash'),
    notFound: require('./ledgerNotFound'),
    withoutCloseTime: require('./ledgerWithoutCloseTime'),
    withSettingsTx: require('./ledgerWithSettingsTx'),
    withStateAsHashes: require('./ledgerWithStateAsHashes'),
    withPartialPayment: require('./ledgerWithPartialPayment'),
    pre2014withPartial: require('./ledgerPre2014WithPartial')
  },
  fee: require('./fee'),
  empty: require('./empty'),
  subscribe: {
    success: require('./subscribe'),
    error: require('./subscribeError')
  },
  unsubscribe: require('./unsubscribe'),
  account_objects: {
    normal: require('./accountObjectsNormal'),
    // notfound: require('./accountObjectsNotFound')
  },
  account_info: {
    normal: require('./accountInfo'),
    notfound: require('./accountInfoNotFound')
  },
  account_offers: require('./accountOffers'),
  account_tx: {
    normal: require('./accountTx'),
    one: require('./getTransactionsOne')
  },
  escrow: require('./escrow'),
  gateway_balances: require('./gatewayBalances'),
  book_offers: {
    fabric: require('./bookOffers'),
    usd_xrp: require('./bookOffersUsdXrp'),
    xrp_usd: require('./bookOffersXrpUsd')
  },
  ledger_current: require('./ledgerCurrent'),
  ledger_data: {
    first_page: require('./ledgerDataFirstPage'),
    last_page: require('./ledgerDataLastPage')
  },
  ledger_entry: {
    error: require('./ledgerEntryError')
  },
  server_info: {
    normal: require('./serverInfo'),
    noValidated: require('./serverInfoNoValidated'),
    syncing: require('./serverInfoSyncing'),
    error: require('./serverInfoError'),
    reporting: require('./serverInfoReporting'),
    highLoadFactor: require('./serverInfoHighLoadFactor')
  },
  path_find: {
    generate: require('./pathFind'),
    sendUSD: require('./pathFindSendUsd'),
    sendAll: require('./pathFindSendAll'),
    XrpToXrp: require('./pathFindXrpToXrp'),
    srcActNotFound: require('./pathFindSrcActNotFound'),
    sourceAmountLow: require('./pathFindSrcAmtLow')
  },
  payment_channel: {
    normal: require('./paymentChannel'),
    full: require('./paymentChannelFull')
  },
  tx: {
    Payment: require('./tx/payment.json'),
    AccountSet: require('./tx/accountSet.json'),
    AccountSetTrackingOn: require('./tx/accountSetTrackingOn.json'),
    AccountSetTrackingOff: require('./tx/accountSetTrackingOff.json'),
    RegularKey: require('./tx/setRegularKey.json'),
    OfferCreate: require('./tx/offerCreate.json'),
    OfferCreateWithMemo: require('./tx/offerCreateWithMemo.json'),
    OfferCreateSell: require('./tx/offerCreateSell.json'),
    OfferCancel: require('./tx/offerCancel.json'),
    OfferCancelWithMemo: require('./tx/offerCancelWithMemo.json'),
    TrustSet: require('./tx/trustSet.json'),
    TrustSetFrozenOff: require('./tx/trustSetFrozenOff.json'),
    TrustSetNoQuality: require('./tx/trustSetNoQuality.json'),
    TrustSetAddMemo: require('./tx/trustSetAddMemo.json'),
    NotFound: require('./tx/notFound.json'),
    NoLedgerIndex: require('./tx/noLedgerIndex.json'),
    NoLedgerFound: require('./tx/noLedgerFound.json'),
    LedgerWithoutTime: require('./tx/ledgerWithoutTime.json'),
    NotValidated: require('./tx/notValidated.json'),
    OfferWithExpiration: require('./tx/orderWithExpiration.json'),
    CheckCreate: require('./tx/checkCreate.json'),
    CheckCreateWithMemo: require('./tx/checkCreateWithMemo.json'),
    CheckCancel: require('./tx/checkCancel.json'),
    CheckCancelWithMemo: require('./tx/checkCancelWithMemo.json'),
    CheckCash: require('./tx/checkCash.json'),
    CheckCashWithMemo: require('./tx/checkCashWithMemo.json'),
    EscrowCreation: require('./tx/escrowCreation.json'),
    EscrowCancellation:
      require('./tx/escrowCancellation.json'),
    EscrowExecution: require('./tx/escrowExecution.json'),
    EscrowExecutionSimple:
      require('./tx/escrowExecutionSimple.json'),
    PaymentChannelCreate: require('./tx/paymentChannelCreate.json'),
    PaymentChannelCreateWithMemo: require('./tx/paymentChannelCreateWithMemo.json'),
    PaymentChannelFund: require('./tx/paymentChannelFund.json'),
    PaymentChannelFundWithMemo: require('./tx/paymentChannelFundWithMemo.json'),
    PaymentChannelClaim: require('./tx/paymentChannelClaim.json'),
    PaymentChannelClaimWithMemo: require('./tx/paymentChannelClaimWithMemo.json'),
    Unrecognized: require('./tx/unrecognized.json'),
    NoMeta: require('./tx/noMeta.json'),
    LedgerZero: require('./tx/ledgerZero.json'),
    Amendment: require('./tx/amendment.json'),
    SetFee: require('./tx/setFee.json'),
    SetFeeWithMemo: require('./tx/setFeeWithMemo.json'),
    TicketCreateWithMemo: require('./tx/ticketCreateWithMemo.json'),
    DepositPreauthWithMemo: require('./tx/depositPreauthWithMemo.json'),
    AccountDelete: require('./tx/accountDelete.json'),
    AccountDeleteWithMemo: require('./tx/accountDeleteWithMemo.json'),
    WithMemo: require('./tx/withMemo.json'),
    WithMemos: require('./tx/withMemos.json')
  }
};
