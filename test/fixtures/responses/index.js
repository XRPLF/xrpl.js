'use strict'; // eslint-disable-line strict

function buildList(options) {
  return new Array(options.count).fill(options.item);
}

module.exports = {
  generateXAddress: require('./generate-x-address.json'),
  generateAddress: require('./generate-address.json'),
  getAccountInfo: require('./get-account-info.json'),
  getAccountObjects: require('./get-account-objects.json'),
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
    orderCancellationWithMemo: require('./get-transaction-order-cancellation-with-memo.json'),
    orderWithExpirationCancellation:
      require('./get-transaction-order-with-expiration-cancellation.json'),
    order: require('./get-transaction-order.json'),
    orderWithMemo: require('./get-transaction-order-with-memo.json'),
    orderSell: require('./get-transaction-order-sell.json'),
    noMeta: require('./get-transaction-no-meta.json'),
    payment: require('./get-transaction-payment.json'),
    paymentIncludeRawTransaction: require('./get-transaction-payment-include-raw-transaction.json'),
    settings: require('./get-transaction-settings.json'),
    trustline: require('./get-transaction-trustline-set.json'),
    trackingOn: require('./get-transaction-settings-tracking-on.json'),
    trackingOff: require('./get-transaction-settings-tracking-off.json'),
    setRegularKey: require('./get-transaction-settings-set-regular-key.json'),
    trustlineFrozenOff: require('./get-transaction-trust-set-frozen-off.json'),
    trustlineNoQuality: require('./get-transaction-trust-no-quality.json'),
    trustlineAddMemo: require('./get-transaction-trust-add-memo.json'),
    notValidated: require('./get-transaction-not-validated.json'),
    checkCreate:
      require('./get-transaction-check-create.json'),
    checkCreateWithMemo:
      require('./get-transaction-check-create-with-memo.json'),
    checkCancel:
      require('./get-transaction-check-cancel.json'),
    checkCancelWithMemo:
      require('./get-transaction-check-cancel-with-memo.json'),
    checkCash:
      require('./get-transaction-check-cash.json'),
    checkCashWithMemo:
      require('./get-transaction-check-cash-with-memo.json'),
    depositPreauthWithMemo:
      require('./get-transaction-deposit-preauth-with-memo.json'),
    escrowCreation:
      require('./get-transaction-escrow-creation.json'),
    escrowCancellation:
      require('./get-transaction-escrow-cancellation.json'),
    escrowExecution:
      require('./get-transaction-escrow-execution.json'),
    escrowExecutionSimple:
      require('./get-transaction-escrow-execution-simple.json'),
    paymentChannelCreate:
      require('./get-transaction-payment-channel-create.json'),
    paymentChannelCreateWithMemo:
      require('./get-transaction-payment-channel-create-with-memo.json'),
    paymentChannelFund:
      require('./get-transaction-payment-channel-fund.json'),
    paymentChannelFundWithMemo:
      require('./get-transaction-payment-channel-fund-with-memo.json'),
    paymentChannelClaim:
      require('./get-transaction-payment-channel-claim.json'),
    paymentChannelClaimWithMemo:
      require('./get-transaction-payment-channel-claim-with-memo.json'),
    amendment: require('./get-transaction-amendment.json'),
    feeUpdate: require('./get-transaction-fee-update.json'),
    feeUpdateWithMemo: require('./get-transaction-fee-update-with-memo.json'),
    accountDelete: require('./get-transaction-account-delete.json'),
    accountDeleteWithMemo: require('./get-transaction-account-delete-with-memo.json'),
    ticketCreateWithMemo: require('./get-transaction-ticket-create-with-memo.json'),
    withMemo: require('./get-transaction-with-memo.json'),
    withMemos: require('./get-transaction-with-memos.json')
  },
  getTransactions: {
    normal: require('./get-transactions.json'),
    includeRawTransactions: require('./get-transactions-include-raw-transactions.json'),
    one: require('./get-transactions-one.json')
  },
  getTrustlines: {
    filtered: require('./get-trustlines.json'),
    moreThan400Items: buildList({
      item: require('./trustline-item.json'),
      count: 401
    }),
    all: require('./get-trustlines-all.json'),
    ripplingDisabled: require('./get-trustlines-rippling-disabled.json')
  },
  getLedger: {
    header: require('./get-ledger'),
    headerByHash: require('./get-ledger-by-hash'),
    full: require('./get-ledger-full'),
    withSettingsTx: require('./get-ledger-with-settings-tx'),
    withStateAsHashes: require('./get-ledger-with-state-as-hashes'),
    withPartial: require('./get-ledger-with-partial-payment'),
    pre2014withPartial: require('./get-ledger-pre2014-with-partial')
  },
  prepareOrder: {
    buy: require('./prepare-order.json'),
    ticket: require('./prepare-order-ticket.json'),
    sell: require('./prepare-order-sell.json'),
    expiration: require('./prepare-order-expiration')
  },
  prepareOrderCancellation: {
    normal: require('./prepare-order-cancellation.json'),
    ticket: require('./prepare-order-cancellation-ticket.json'),
    withMemos: require('./prepare-order-cancellation-memos.json'),
    noInstructions: require('./prepare-order-cancellation-no-instructions.json')
  },
  preparePayment: {
    normal: require('./prepare-payment.json'),
    ticket: require('./prepare-payment-ticket'),
    minAmountXRP: require('./prepare-payment-min-amount-xrp.json'),
    minAmountXRPXRP: require('./prepare-payment-min-amount-xrp-xrp.json'),
    allOptions: require('./prepare-payment-all-options.json'),
    noCounterparty: require('./prepare-payment-no-counterparty.json'),
    minAmount: require('./prepare-payment-min-amount.json'),
    ticketSequence: require('./prepare-payment-ticket-sequence.json')
  },
  prepareSettings: {
    regularKey: require('./prepare-settings-regular-key.json'),
    removeRegularKey: require('./prepare-settings-remove-regular-key.json'),
    flags: require('./prepare-settings.json'),
    ticket: require('./prepare-settings-ticket.json'),
    flagsMultisign: require('./prepare-settings-multisign.json'),
    flagSet: require('./prepare-settings-flag-set.json'),
    flagClear: require('./prepare-settings-flag-clear.json'),
    flagSetDepositAuth: require('./prepare-settings-flag-set-deposit-auth.json'),
    flagClearDepositAuth: require('./prepare-settings-flag-clear-deposit-auth.json'),
    setTransferRate: require('./prepare-settings-set-transfer-rate.json'),
    fieldClear: require('./prepare-settings-field-clear.json'),
    noInstructions: require('./prepare-settings-no-instructions.json'),
    signed: require('./prepare-settings-signed.json'),
    noMaxLedgerVersion: require('./prepare-settings-no-maxledgerversion.json'),
    signers: require('./prepare-settings-signers.json'),
    noSignerList: require('./prepare-settings-no-signer-list.json'),
    noWeights: require('./prepare-settings-no-weight.json')
  },
  prepareCheckCreate: {
    normal: require('./prepare-check-create'),
    ticket: require('./prepare-check-create-ticket'),
    full: require('./prepare-check-create-full')
  },
  prepareCheckCash: {
    amount: require('./prepare-check-cash-amount'),
    ticket: require('./prepare-check-cash-ticket'),
    deliverMin: require('./prepare-check-cash-delivermin')
  },
  prepareCheckCancel: {
    normal: require('./prepare-check-cancel'),
    ticket: require('./prepare-check-cancel-ticket')
  },
  prepareEscrowCreation: {
    normal: require('./prepare-escrow-creation'),
    ticket: require('./prepare-escrow-creation-ticket'),
    full: require('./prepare-escrow-creation-full')
  },
  prepareEscrowExecution: {
    normal: require('./prepare-escrow-execution'),
    ticket: require('./prepare-escrow-execution-ticket'),
    simple: require('./prepare-escrow-execution-simple')
  },
  prepareEscrowCancellation: {
    normal: require('./prepare-escrow-cancellation'),
    ticket: require('./prepare-escrow-cancellation-ticket'),
    memos: require('./prepare-escrow-cancellation-memos')
  },
  preparePaymentChannelCreate: {
    normal: require('./prepare-payment-channel-create'),
    ticket: require('./prepare-payment-channel-create-ticket'),
    full: require('./prepare-payment-channel-create-full')
  },
  preparePaymentChannelFund: {
    normal: require('./prepare-payment-channel-fund'),
    ticket: require('./prepare-payment-channel-fund-ticket'),
    full: require('./prepare-payment-channel-fund-full')
  },
  preparePaymentChannelClaim: {
    normal: require('./prepare-payment-channel-claim'),
    ticket: require('./prepare-payment-channel-claim-ticket'),
    renew: require('./prepare-payment-channel-claim-renew'),
    close: require('./prepare-payment-channel-claim-close')
  },
  prepareTrustline: {
    simple: require('./prepare-trustline-simple'),
    ticket: require('./prepare-trustline-ticket'),
    frozen: require('./prepare-trustline-frozen'),
    issuedXAddress: require('./prepare-trustline-issuer-xaddress.json'),
    complex: require('./prepare-trustline')
  },
  sign: {
    normal: require('./sign'),
    ticket: require('./sign-ticket'),
    escrow: require('./sign-escrow'),
    signAs: require('./sign-as')
  },
  signPaymentChannelClaim: require('./sign-payment-channel-claim'),
  combine: {
    single: require('./combine')
  },
  submit: require('./submit'),
  ledgerEvent: require('./ledger-event'),
  generateFaucetWallet: require('./generate-faucet-wallet.json')
};
