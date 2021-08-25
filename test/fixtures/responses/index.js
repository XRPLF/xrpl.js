'use strict'; // eslint-disable-line strict

function buildList(options) {
  return new Array(options.count).fill(options.item);
}

module.exports = {
  generateXAddress: require('./generateXAddress.json'),
  generateAddress: require('./generateAddress.json'),
  getAccountInfo: require('./getAccountInfo.json'),
  getAccountObjects: require('./getAccountObjects.json'),
  getBalances: require('./getBalances.json'),
  getBalanceSheet: require('./getBalanceSheet.json'),
  getOrderbook: {
    normal: require('./getOrderbook.json'),
    withXRP: require('./getOrderbookWithXrp.json')
  },
  getOrders: require('./getOrders.json'),
  getPaths: {
    XrpToUsd: require('./getPaths.json'),
    UsdToUsd: require('./getPathsSendUsd.json'),
    XrpToXrp: require('./getPathsXrpToXrp.json'),
    sendAll: require('./getPathsSendAll.json')
  },
  getPaymentChannel: {
    normal: require('./getPaymentChannel.json'),
    full: require('./getPaymentChannelFull.json')
  },
  getServerInfo: require('./getServerInfo.json'),
  getSettings: require('./getSettings.json'),
  getTransaction: {
    orderCancellation: require('./getTransactionOrderCancellation.json'),
    orderCancellationWithMemo: require('./getTransactionOrderCancellationWithMemo.json'),
    orderWithExpirationCancellation:
      require('./getTransactionOrderWithExpirationCancellation.json'),
    order: require('./getTransactionOrder.json'),
    orderWithMemo: require('./getTransactionOrderWithMemo.json'),
    orderSell: require('./getTransactionOrderSell.json'),
    noMeta: require('./getTransactionNoMeta.json'),
    payment: require('./getTransactionPayment.json'),
    paymentIncludeRawTransaction: require('./getTransactionPaymentIncludeRawTransaction.json'),
    settings: require('./getTransactionSettings.json'),
    trustline: require('./getTransactionTrustlineSet.json'),
    trackingOn: require('./getTransactionSettingsTrackingOn.json'),
    trackingOff: require('./getTransactionSettingsTrackingOff.json'),
    setRegularKey: require('./getTransactionSettingsSetRegularKey.json'),
    trustlineFrozenOff: require('./getTransactionTrustSetFrozenOff.json'),
    trustlineNoQuality: require('./getTransactionTrustNoQuality.json'),
    trustlineAddMemo: require('./getTransactionTrustAddMemo.json'),
    notValidated: require('./getTransactionNotValidated.json'),
    checkCreate:
      require('./getTransactionCheckCreate.json'),
    checkCreateWithMemo:
      require('./getTransactionCheckCreateWithMemo.json'),
    checkCancel:
      require('./getTransactionCheckCancel.json'),
    checkCancelWithMemo:
      require('./getTransactionCheckCancelWithMemo.json'),
    checkCash:
      require('./getTransactionCheckCash.json'),
    checkCashWithMemo:
      require('./getTransactionCheckCashWithMemo.json'),
    depositPreauthWithMemo:
      require('./getTransactionDepositPreauthWithMemo.json'),
    escrowCreation:
      require('./getTransactionEscrowCreation.json'),
    escrowCancellation:
      require('./getTransactionEscrowCancellation.json'),
    escrowExecution:
      require('./getTransactionEscrowExecution.json'),
    escrowExecutionSimple:
      require('./getTransactionEscrowExecutionSimple.json'),
    paymentChannelCreate:
      require('./getTransactionPaymentChannelCreate.json'),
    paymentChannelCreateWithMemo:
      require('./getTransactionPaymentChannelCreateWithMemo.json'),
    paymentChannelFund:
      require('./getTransactionPaymentChannelFund.json'),
    paymentChannelFundWithMemo:
      require('./getTransactionPaymentChannelFundWithMemo.json'),
    paymentChannelClaim:
      require('./getTransactionPaymentChannelClaim.json'),
    paymentChannelClaimWithMemo:
      require('./getTransactionPaymentChannelClaimWithMemo.json'),
    amendment: require('./getTransactionAmendment.json'),
    feeUpdate: require('./getTransactionFeeUpdate.json'),
    feeUpdateWithMemo: require('./getTransactionFeeUpdateWithMemo.json'),
    accountDelete: require('./getTransactionAccountDelete.json'),
    accountDeleteWithMemo: require('./getTransactionAccountDeleteWithMemo.json'),
    ticketCreateWithMemo: require('./getTransactionTicketCreateWithMemo.json'),
    withMemo: require('./getTransactionWithMemo.json'),
    withMemos: require('./getTransactionWithMemos.json')
  },
  getTransactions: {
    normal: require('./getTransactions.json'),
    includeRawTransactions: require('./getTransactionsIncludeRawTransactions.json'),
    one: require('./getTransactionsOne.json')
  },
  getTrustlines: {
    filtered: require('./getTrustlines.json'),
    moreThan400Items: buildList({
      item: require('./trustlineItem.json'),
      count: 401
    }),
    all: require('./getTrustlinesAll.json'),
    ripplingDisabled: require('./getTrustlinesRipplingDisabled.json')
  },
  getLedger: {
    header: require('./getLedger'),
    headerByHash: require('./getLedgerByHash'),
    full: require('./getLedgerFull'),
    withSettingsTx: require('./getLedgerWithSettingsTx'),
    withStateAsHashes: require('./getLedgerWithStateAsHashes'),
    withPartial: require('./getLedgerWithPartialPayment'),
    pre2014withPartial: require('./getLedgerPre2014WithPartial')
  },
  prepareOrder: {
    buy: require('./prepareOrder.json'),
    ticket: require('./prepareOrderTicket.json'),
    sell: require('./prepareOrderSell.json'),
    expiration: require('./prepareOrderExpiration')
  },
  prepareOrderCancellation: {
    normal: require('./prepareOrderCancellation.json'),
    ticket: require('./prepareOrderCancellationTicket.json'),
    withMemos: require('./prepareOrderCancellationMemos.json'),
    noInstructions: require('./prepareOrderCancellationNoInstructions.json')
  },
  preparePayment: {
    normal: require('./preparePayment.json'),
    ticket: require('./preparePaymentTicket'),
    minAmountXRP: require('./preparePaymentMinAmountXrp.json'),
    minAmountXRPXRP: require('./preparePaymentMinAmountXrpXrp.json'),
    allOptions: require('./preparePaymentAllOptions.json'),
    noCounterparty: require('./preparePaymentNoCounterparty.json'),
    minAmount: require('./preparePaymentMinAmount.json'),
    ticketSequence: require('./preparePaymentTicketSequence.json')
  },
  prepareSettings: {
    regularKey: require('./prepareSettingsRegularKey.json'),
    removeRegularKey: require('./prepareSettingsRemoveRegularKey.json'),
    flags: require('./prepareSettings.json'),
    ticket: require('./prepareSettingsTicket.json'),
    flagsMultisign: require('./prepareSettingsMultisign.json'),
    flagSet: require('./prepareSettingsFlagSet.json'),
    flagClear: require('./prepareSettingsFlagClear.json'),
    flagSetDepositAuth: require('./prepareSettingsFlagSetDepositAuth.json'),
    flagClearDepositAuth: require('./prepareSettingsFlagClearDepositAuth.json'),
    setTransferRate: require('./prepareSettingsSetTransferRate.json'),
    fieldClear: require('./prepareSettingsFieldClear.json'),
    noInstructions: require('./prepareSettingsNoInstructions.json'),
    signed: require('./prepareSettingsSigned.json'),
    noMaxLedgerVersion: require('./prepareSettingsNoMaxledgerversion.json'),
    signers: require('./prepareSettingsSigners.json'),
    noSignerList: require('./prepareSettingsNoSignerList.json'),
    noWeights: require('./prepareSettingsNoWeight.json')
  },
  prepareCheckCreate: {
    normal: require('./prepareCheckCreate'),
    ticket: require('./prepareCheckCreateTicket'),
    full: require('./prepareCheckCreateFull')
  },
  prepareCheckCash: {
    amount: require('./prepareCheckCashAmount'),
    ticket: require('./prepareCheckCashTicket'),
    deliverMin: require('./prepareCheckCashDelivermin')
  },
  prepareCheckCancel: {
    normal: require('./prepareCheckCancel'),
    ticket: require('./prepareCheckCancelTicket')
  },
  prepareEscrowCreation: {
    normal: require('./prepareEscrowCreation'),
    ticket: require('./prepareEscrowCreationTicket'),
    full: require('./prepareEscrowCreationFull')
  },
  prepareEscrowExecution: {
    normal: require('./prepareEscrowExecution'),
    ticket: require('./prepareEscrowExecutionTicket'),
    simple: require('./prepareEscrowExecutionSimple')
  },
  prepareEscrowCancellation: {
    normal: require('./prepareEscrowCancellation'),
    ticket: require('./prepareEscrowCancellationTicket'),
    memos: require('./prepareEscrowCancellationMemos')
  },
  preparePaymentChannelCreate: {
    normal: require('./preparePaymentChannelCreate'),
    ticket: require('./preparePaymentChannelCreateTicket'),
    full: require('./preparePaymentChannelCreateFull')
  },
  preparePaymentChannelFund: {
    normal: require('./preparePaymentChannelFund'),
    ticket: require('./preparePaymentChannelFundTicket'),
    full: require('./preparePaymentChannelFundFull')
  },
  preparePaymentChannelClaim: {
    normal: require('./preparePaymentChannelClaim'),
    ticket: require('./preparePaymentChannelClaimTicket'),
    renew: require('./preparePaymentChannelClaimRenew'),
    close: require('./preparePaymentChannelClaimClose')
  },
  prepareTrustline: {
    simple: require('./prepareTrustlineSimple'),
    ticket: require('./prepareTrustlineTicket'),
    frozen: require('./prepareTrustlineFrozen'),
    issuedXAddress: require('./prepareTrustlineIssuerXaddress.json'),
    complex: require('./prepareTrustline')
  },
  sign: {
    normal: require('./sign'),
    ticket: require('./signTicket'),
    escrow: require('./signEscrow'),
    signAs: require('./signAs')
  },
  signPaymentChannelClaim: require('./signPaymentChannelClaim'),
  combine: {
    single: require('./combine')
  },
  submit: require('./submit'),
  ledgerEvent: require('./ledgerEvent'),
  generateFaucetWallet: require('./generateFaucetWallet.json')
};
