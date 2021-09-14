import setDomain from './combine.json'
import header from './computeLedgerHash.json'
import transactions from './computeLedgerHashTransactions.json'
import normalOrderBook from './getOrderbook.json'
import withXRPOrderBook from './getOrderbookWithXrp.json'
import invalid from './getpaths/invalid.json'
import issuer from './getpaths/issuer.json'
import NoPaths from './getpaths/noPaths.json'
import NoPathsSource from './getpaths/noPathsSourceAmount.json'
import NoPathsWithCurrencies from './getpaths/noPathsWithCurrencies.json'
import normalPaths from './getpaths/normal.json'
import NotAcceptCurrency from './getpaths/notAcceptCurrency.json'
import sendAll from './getpaths/sendAll.json'
import UsdToUsd from './getpaths/usd2usd.json'
import XrpToXrp from './getpaths/xrp2xrp.json'
import XrpToXrpNotEnough from './getpaths/xrp2xrpNotEnough.json'
import normalCheckCancel from './prepareCheckCancel.json'
import amountCheckCash from './prepareCheckCashAmount.json'
import deliverMinCheckCash from './prepareCheckCashDelivermin.json'
import normalCheckCreate from './prepareCheckCreate.json'
import fullCheckCreate from './prepareCheckCreateFull.json'
import normalEscrowCancel from './prepareEscrowCancellation.json'
import memosEscrowCancel from './prepareEscrowCancellationMemos.json'
import normalEscrowCreate from './prepareEscrowCreation.json'
import fullEscrowCreate from './prepareEscrowCreationFull.json'
import normalEscrowExec from './prepareEscrowExecution.json'
import noConditionEscrowExec from './prepareEscrowExecutionNoCondition.json'
import noFulfillmentEscrowExec from './prepareEscrowExecutionNoFulfillment.json'
import simpleEscrowExec from './prepareEscrowExecutionSimple.json'
import buyOrder from './prepareOrder.json'
import simpleCancel from './prepareOrderCancellation.json'
import withMemosCancel from './prepareOrderCancellationMemos.json'
import expirationOrder from './prepareOrderExpiration.json'
import sellOrder from './prepareOrderSell.json'
import normalPayment from './preparePayment.json'
import allOptions from './preparePaymentAllOptions.json'
import normalPayChanClaim from './preparePaymentChannelClaim.json'
import closePayChanClaim from './preparePaymentChannelClaimClose.json'
import fullPayChanClaim from './preparePaymentChannelClaimFull.json'
import noSignaturePayChanClaim from './preparePaymentChannelClaimNoSignature.json'
import renewPayChanClaim from './preparePaymentChannelClaimRenew.json'
import normalPayChanCreate from './preparePaymentChannelCreate.json'
import fullPayChanCreate from './preparePaymentChannelCreateFull.json'
import normalPayChanFund from './preparePaymentChannelFund.json'
import fullPayChanFund from './preparePaymentChannelFundFull.json'
import minAmount from './preparePaymentMin.json'
import minAmountXRP from './preparePaymentMinXrp.json'
import noCounterparty from './preparePaymentNoCounterparty.json'
import wrongAddress from './preparePaymentWrongAddress.json'
import wrongAmount from './preparePaymentWrongAmount.json'
import wrongPartial from './preparePaymentWrongPartial.json'
import domain from './prepareSettings.json'
import noSignerEntries from './prepareSettingsNoSignerEntries.json'
import normalSigners from './prepareSettingsSigners.json'
import noThresholdSigners from './prepareSettingsSignersNoThreshold.json'
import noWeightsSigners from './prepareSettingsSignersNoWeights.json'
import complexTrustline from './prepareTrustline.json'
import frozenTrustline from './prepareTrustlineFrozen.json'
import issuedXAddressTrustline from './prepareTrustlineIssuerXaddress.json'
import simpleTrustline from './prepareTrustlineSimple.json'
import normalSign from './sign.json'
import signAsSign from './signAs.json'
import escrowSign from './signEscrow.json'
import signPaymentChannelClaim from './signPaymentChannelClaim.json'
import ticketSign from './signTicket.json'

const prepareOrder = {
  buy: buyOrder,
  sell: sellOrder,
  expiration: expirationOrder,
}

const prepareOrderCancellation = {
  simple: simpleCancel,
  withMemos: withMemosCancel,
}

const preparePayment = {
  normal: normalPayment,
  minAmountXRP,
  minAmount,
  wrongAddress,
  wrongAmount,
  wrongPartial,
  allOptions,
  noCounterparty,
}

const prepareSettings = {
  domain,
  noSignerEntries,
  signers: {
    normal: normalSigners,
    noThreshold: noThresholdSigners,
    noWeights: noWeightsSigners,
  },
}
const prepareEscrowCreation = {
  normal: normalEscrowCreate,
  full: fullEscrowCreate,
}

const prepareEscrowExecution = {
  normal: normalEscrowExec,
  simple: simpleEscrowExec,
  noCondition: noConditionEscrowExec,
  noFulfillment: noFulfillmentEscrowExec,
}

const prepareEscrowCancellation = {
  normal: normalEscrowCancel,
  memos: memosEscrowCancel,
}

const prepareCheckCreate = {
  normal: normalCheckCreate,
  full: fullCheckCreate,
}

const prepareCheckCash = {
  amount: amountCheckCash,
  deliverMin: deliverMinCheckCash,
}

const prepareCheckCancel = {
  normal: normalCheckCancel,
}

const preparePaymentChannelCreate = {
  normal: normalPayChanCreate,
  full: fullPayChanCreate,
}

const preparePaymentChannelFund = {
  normal: normalPayChanFund,
  full: fullPayChanFund,
}

const preparePaymentChannelClaim = {
  normal: normalPayChanClaim,
  full: fullPayChanClaim,
  close: closePayChanClaim,
  renew: renewPayChanClaim,
  noSignature: noSignaturePayChanClaim,
}

const prepareTrustline = {
  simple: simpleTrustline,
  complex: complexTrustline,
  frozen: frozenTrustline,
  issuedXAddress: issuedXAddressTrustline,
}

const sign = {
  normal: normalSign,
  ticket: ticketSign,
  escrow: escrowSign,
  signAs: signAsSign,
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
  issuer,
}

const getOrderbook = {
  normal: normalOrderBook,
  withXRP: withXRPOrderBook,
}

const computeLedgerHash = {
  header,
  transactions,
}

const combine = {
  setDomain,
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
  signPaymentChannelClaim,
}

export default requests
