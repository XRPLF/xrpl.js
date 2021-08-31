import setDomain from './combine.json'
import transactions from './computeLedgerHashTransactions.json'
import header from './computeLedgerHash.json'
import withXRPOrderBook from './getOrderbookWithXrp.json'
import normalOrderBook from './getOrderbook.json'
import invalid from './getpaths/invalid.json'
import issuer from './getpaths/issuer.json'
import NoPathsSource from './getpaths/noPathsSourceAmount.json'
import NoPathsWithCurrencies from './getpaths/noPathsWithCurrencies.json'
import NoPaths from './getpaths/noPaths.json'
import normalPaths from './getpaths/normal.json'
import NotAcceptCurrency from './getpaths/notAcceptCurrency.json'
import sendAll from './getpaths/sendAll.json'
import UsdToUsd from './getpaths/usd2usd.json'
import XrpToXrpNotEnough from './getpaths/xrp2xrpNotEnough.json'
import XrpToXrp from './getpaths/xrp2xrp.json'
import normalCheckCancel from './prepareCheckCancel.json'
import amountCheckCash from './prepareCheckCashAmount.json'
import deliverMinCheckCash from './prepareCheckCashDelivermin.json'
import fullCheckCreate from './prepareCheckCreateFull.json'
import normalCheckCreate from './prepareCheckCreate.json'
import memosEscrowCancel from './prepareEscrowCancellationMemos.json'
import normalEscrowCancel from './prepareEscrowCancellation.json'
import fullEscrowCreate from './prepareEscrowCreationFull.json'
import normalEscrowCreate from './prepareEscrowCreation.json'
import noConditionEscrowExec from './prepareEscrowExecutionNoCondition.json'
import noFulfillmentEscrowExec from './prepareEscrowExecutionNoFulfillment.json'
import simpleEscrowExec from './prepareEscrowExecutionSimple.json'
import normalEscrowExec from './prepareEscrowExecution.json'
import withMemosCancel from './prepareOrderCancellationMemos.json'
import simpleCancel from './prepareOrderCancellation.json'
import expirationOrder from './prepareOrderExpiration.json'
import sellOrder from './prepareOrderSell.json'
import buyOrder from './prepareOrder.json'
import allOptions from './preparePaymentAllOptions.json'
import closePayChanClaim from './preparePaymentChannelClaimClose.json'
import fullPayChanClaim from './preparePaymentChannelClaimFull.json'
import noSignaturePayChanClaim from './preparePaymentChannelClaimNoSignature.json'
import renewPayChanClaim from './preparePaymentChannelClaimRenew.json'
import normalPayChanClaim from './preparePaymentChannelClaim.json'
import fullPayChanCreate from './preparePaymentChannelCreateFull.json'
import normalPayChanCreate from './preparePaymentChannelCreate.json'
import fullPayChanFund from './preparePaymentChannelFundFull.json'
import normalPayChanFund from './preparePaymentChannelFund.json'
import minAmountXRP from './preparePaymentMinXrp.json'
import minAmount from './preparePaymentMin.json'
import noCounterparty from './preparePaymentNoCounterparty.json'
import wrongAddress from './preparePaymentWrongAddress.json'
import wrongAmount from './preparePaymentWrongAmount.json'
import wrongPartial from './preparePaymentWrongPartial.json'
import normalPayment from './preparePayment.json'
import noSignerEntries from './prepareSettingsNoSignerEntries.json'
import noThresholdSigners from './prepareSettingsSignersNoThreshold.json'
import noWeightsSigners from './prepareSettingsSignersNoWeights.json'
import normalSigners from './prepareSettingsSigners.json'
import domain from './prepareSettings.json'
import frozenTrustline from './prepareTrustlineFrozen.json'
import issuedXAddressTrustline from './prepareTrustlineIssuerXaddress.json'
import simpleTrustline from './prepareTrustlineSimple.json'
import complexTrustline from './prepareTrustline.json'
import signAsSign from './signAs.json'
import escrowSign from './signEscrow.json'
import signPaymentChannelClaim from './signPaymentChannelClaim.json'
import ticketSign from './signTicket.json'
import normalSign from './sign.json'

const prepareOrder = {
  buy: buyOrder,
  sell: sellOrder,
  expiration: expirationOrder
}

const prepareOrderCancellation = {
  simple: simpleCancel,
  withMemos: withMemosCancel
}

const preparePayment = {
  normal: normalPayment,
  minAmountXRP,
  minAmount,
  wrongAddress,
  wrongAmount,
  wrongPartial,
  allOptions,
  noCounterparty
}

const prepareSettings = {
  domain,
  noSignerEntries,
  signers: {
    normal: normalSigners,
    noThreshold: noThresholdSigners,
    noWeights: noWeightsSigners
  }
}
const prepareEscrowCreation = {
  normal: normalEscrowCreate,
  full: fullEscrowCreate
}

const prepareEscrowExecution = {
  normal: normalEscrowExec,
  simple: simpleEscrowExec,
  noCondition: noConditionEscrowExec,
  noFulfillment: noFulfillmentEscrowExec
}

const prepareEscrowCancellation = {
  normal: normalEscrowCancel,
  memos: memosEscrowCancel
}

const prepareCheckCreate = {
  normal: normalCheckCreate,
  full: fullCheckCreate
}

const prepareCheckCash = {
  amount: amountCheckCash,
  deliverMin: deliverMinCheckCash
}

const prepareCheckCancel = {
  normal: normalCheckCancel
}

const preparePaymentChannelCreate = {
  normal: normalPayChanCreate,
  full: fullPayChanCreate
}

const preparePaymentChannelFund = {
  normal: normalPayChanFund,
  full: fullPayChanFund
}

const preparePaymentChannelClaim = {
  normal: normalPayChanClaim,
  full: fullPayChanClaim,
  close: closePayChanClaim,
  renew: renewPayChanClaim,
  noSignature: noSignaturePayChanClaim
}

const prepareTrustline = {
  simple: simpleTrustline,
  complex: complexTrustline,
  frozen: frozenTrustline,
  issuedXAddress: issuedXAddressTrustline
}

const sign = {
  normal: normalSign,
  ticket: ticketSign,
  escrow: escrowSign,
  signAs: signAsSign
}

const getPaths = {
  normal: normalPaths,
  UsdToUsd,
  XrpToXrp,
  XrpToXrpNotEnough,
  NotAcceptCurrency,
  NoPaths,
  NoPathsSource,
  NoPathsWithCurrencies,
  sendAll,
  invalid,
  issuer
}

const getOrderbook = {
  normal: normalOrderBook,
  withXRP: withXRPOrderBook
}

const computeLedgerHash = {
  header: {...header, rawTransactions: JSON.stringify(transactions)},
  transactions
}

const combine = {
  setDomain
}

const requests = {
  combine,
  computeLedgerHash,
  getOrderbook,
  getPaths,
  prepareCheckCash,
  prepareCheckCancel,
  prepareCheckCreate,
  prepareEscrowCancellation,
  prepareEscrowCreation,
  prepareEscrowExecution,
  prepareOrder,
  prepareOrderCancellation,
  preparePayment,
  preparePaymentChannelClaim,
  preparePaymentChannelCreate,
  preparePaymentChannelFund,
  prepareTrustline,
  prepareSettings,
  sign,
  signPaymentChannelClaim
}

export default requests
