'use strict';

module.exports = {
  prepareOrder: {
    buy: require('./prepareOrder'),
    sell: require('./prepareOrderSell'),
    expiration: require('./prepareOrderExpiration')
  },
  prepareOrderCancellation: {
    simple: require('./prepareOrderCancellation'),
    withMemos: require('./prepareOrderCancellationMemos')
  },
  preparePayment: {
    normal: require('./preparePayment'),
    minAmountXRP: require('./preparePaymentMinXrp'),
    minAmount: require('./preparePaymentMin'),
    wrongAddress: require('./preparePaymentWrongAddress'),
    wrongAmount: require('./preparePaymentWrongAmount'),
    wrongPartial: require('./preparePaymentWrongPartial'),
    allOptions: require('./preparePaymentAllOptions'),
    noCounterparty: require('./preparePaymentNoCounterparty')
  },
  prepareSettings: {
    domain: require('./prepareSettings'),
    noSignerEntries: require('./prepareSettingsNoSignerEntries'),
    signers: {
      normal: require('./prepareSettingsSigners'),
      noThreshold: require('./prepareSettingsSignersNoThreshold'),
      noWeights: require('./prepareSettingsSignersNoWeights')
    }
  },
  prepareEscrowCreation: {
    normal: require('./prepareEscrowCreation'),
    full: require('./prepareEscrowCreationFull')
  },
  prepareEscrowExecution: {
    normal: require('./prepareEscrowExecution'),
    simple: require('./prepareEscrowExecutionSimple'),
    noCondition: require('./prepareEscrowExecutionNoCondition'),
    noFulfillment: require('./prepareEscrowExecutionNoFulfillment')
  },
  prepareEscrowCancellation: {
    normal: require('./prepareEscrowCancellation'),
    memos: require('./prepareEscrowCancellationMemos')
  },
  prepareCheckCreate: {
    normal: require('./prepareCheckCreate'),
    full: require('./prepareCheckCreateFull')
  },
  prepareCheckCash: {
    amount: require('./prepareCheckCashAmount'),
    deliverMin: require('./prepareCheckCashDelivermin')
  },
  prepareCheckCancel: {
    normal: require('./prepareCheckCancel')
  },
  preparePaymentChannelCreate: {
    normal: require('./preparePaymentChannelCreate'),
    full: require('./preparePaymentChannelCreateFull')
  },
  preparePaymentChannelFund: {
    normal: require('./preparePaymentChannelFund'),
    full: require('./preparePaymentChannelFundFull')
  },
  preparePaymentChannelClaim: {
    normal: require('./preparePaymentChannelClaim'),
    full: require('./preparePaymentChannelClaimFull'),
    close: require('./preparePaymentChannelClaimClose'),
    renew: require('./preparePaymentChannelClaimRenew'),
    noSignature: require('./preparePaymentChannelClaimNoSignature')
  },
  prepareTrustline: {
    simple: require('./prepareTrustlineSimple'),
    complex: require('./prepareTrustline'),
    frozen: require('./prepareTrustlineFrozen.json'),
    issuedXAddress: require('./prepareTrustlineIssuerXaddress.json')
  },
  sign: {
    normal: require('./sign'),
    ticket: require('./signTicket'),
    escrow: require('./signEscrow.json'),
    signAs: require('./signAs')
  },
  signPaymentChannelClaim: require('./signPaymentChannelClaim'),
  getPaths: {
    normal: require('./getpaths/normal'),
    UsdToUsd: require('./getpaths/usd2usd'),
    XrpToXrp: require('./getpaths/xrp2xrp'),
    XrpToXrpNotEnough: require('./getpaths/xrp2xrpNotEnough'),
    NotAcceptCurrency: require('./getpaths/notAcceptCurrency'),
    NoPaths: require('./getpaths/noPaths'),
    NoPathsSource: require('./getpaths/noPathsSourceAmount'),
    NoPathsWithCurrencies: require('./getpaths/noPathsWithCurrencies'),
    sendAll: require('./getpaths/sendAll'),
    invalid: require('./getpaths/invalid'),
    issuer: require('./getpaths/issuer')
  },
  getOrderbook: {
    normal: require('./getOrderbook'),
    withXRP: require('./getOrderbookWithXrp')
  },
  computeLedgerHash: {
    header: require('./computeLedgerHash'),
    transactions: require('./computeLedgerHashTransactions')
  },
  combine: {
    setDomain: require('./combine.json')
  }
};
