import normalAccountInfo from './accountInfo.json'
import notfoundAccountInfo from './accountInfoNotFound.json'
import emptyAccountObjects from './accountObjectsEmpty.json'
import normalAccountObjects from './accountObjectsNormal.json'
import account_offers from './accountOffers'
import normalAccountTx from './accountTx.json'
import fabric from './bookOffers'
import usd_xrp from './bookOffersUsdXrp.json'
import xrp_usd from './bookOffersXrpUsd.json'
import empty from './empty.json'
import escrow from './escrow.json'
import fee from './fee.json'
import gateway_balances from './gatewayBalances.json'
import oneAccountTx from './getTransactionsOne.json'
import normalLedger from './ledger.json'
import normalByHash from './ledgerByHash.json'
import ledger_current from './ledgerCurrent.json'
import first_page from './ledgerDataFirstPage.json'
import last_page from './ledgerDataLastPage.json'
import errorLedgerEntry from './ledgerEntryError.json'
import notFound from './ledgerNotFound.json'
import pre2014withPartial from './ledgerPre2014WithPartial.json'
import withoutCloseTime from './ledgerWithoutCloseTime.json'
import withPartialPayment from './ledgerWithPartialPayment.json'
import withSettingsTx from './ledgerWithSettingsTx.json'
import withStateAsHashes from './ledgerWithStateAsHashes.json'
import iouPartialPayment from './partialPaymentIOU.json'
import xrpPartialPayment from './partialPaymentXRP.json'
import generate from './pathFind'
import sendAll from './pathFindSendAll.json'
import sendUSD from './pathFindSendUsd.json'
import srcActNotFound from './pathFindSrcActNotFound.json'
import sourceAmountLow from './pathFindSrcAmtLow.json'
import XrpToXrp from './pathFindXrpToXrp.json'
import normalPayChan from './paymentChannel.json'
import fullPayChan from './paymentChannelFull.json'
import normalServerInfo from './serverInfo.json'
import errorServerInfo from './serverInfoError.json'
import highLoadFactor from './serverInfoHighLoadFactor.json'
import noValidated from './serverInfoNoValidated.json'
import reporting from './serverInfoReporting.json'
import syncing from './serverInfoSyncing.json'
import consensusStream from './streams/consensusPhase.json'
import ledgerStream from './streams/ledger.json'
import manifestStream from './streams/manifest.json'
import pathFindStream from './streams/pathFind.json'
import peerStatusStream from './streams/peerStatusChange.json'
import serverStatusStream from './streams/serverStatus.json'
import transactionStream from './streams/transaction.json'
import validationStream from './streams/validation.json'
import successSubmit from './submit.json'
import failureSubmit from './submitFailed.json'
import successSubscribe from './subscribe.json'
import errorSubscribe from './subscribeError.json'
import transaction_entry from './transactionEntry.json'
import AccountDelete from './tx/accountDelete.json'
import AccountDeleteWithMemo from './tx/accountDeleteWithMemo.json'
import AccountSet from './tx/accountSet.json'
import AccountSetTrackingOff from './tx/accountSetTrackingOff.json'
import AccountSetTrackingOn from './tx/accountSetTrackingOn.json'
import Amendment from './tx/amendment.json'
import CheckCancel from './tx/checkCancel.json'
import CheckCancelWithMemo from './tx/checkCancelWithMemo.json'
import CheckCash from './tx/checkCash.json'
import CheckCashWithMemo from './tx/checkCashWithMemo.json'
import CheckCreate from './tx/checkCreate.json'
import CheckCreateWithMemo from './tx/checkCreateWithMemo.json'
import DepositPreauthWithMemo from './tx/depositPreauthWithMemo.json'
import EscrowCancellation from './tx/escrowCancellation.json'
import EscrowCreation from './tx/escrowCreation.json'
import EscrowExecution from './tx/escrowExecution.json'
import EscrowExecutionSimple from './tx/escrowExecutionSimple.json'
import LedgerWithoutTime from './tx/ledgerWithoutTime.json'
import LedgerZero from './tx/ledgerZero.json'
import NoLedgerFound from './tx/noLedgerFound.json'
import NoLedgerIndex from './tx/noLedgerIndex.json'
import NoMeta from './tx/noMeta.json'
import NotFound from './tx/notFound.json'
import NotValidated from './tx/notValidated.json'
import OfferCancel from './tx/offerCancel.json'
import OfferCancelWithMemo from './tx/offerCancelWithMemo.json'
import OfferCreate from './tx/offerCreate.json'
import OfferCreateSell from './tx/offerCreateSell.json'
import OfferCreateWithMemo from './tx/offerCreateWithMemo.json'
import OfferWithExpiration from './tx/orderWithExpiration.json'
import Payment from './tx/payment.json'
import PaymentChannelClaim from './tx/paymentChannelClaim.json'
import PaymentChannelClaimWithMemo from './tx/paymentChannelClaimWithMemo.json'
import PaymentChannelCreate from './tx/paymentChannelCreate.json'
import PaymentChannelCreateWithMemo from './tx/paymentChannelCreateWithMemo.json'
import PaymentChannelFund from './tx/paymentChannelFund.json'
import PaymentChannelFundWithMemo from './tx/paymentChannelFundWithMemo.json'
import SetFee from './tx/setFee.json'
import SetFeeWithMemo from './tx/setFeeWithMemo.json'
import RegularKey from './tx/setRegularKey.json'
import TicketCreateWithMemo from './tx/ticketCreateWithMemo.json'
import TrustSet from './tx/trustSet.json'
import TrustSetAddMemo from './tx/trustSetAddMemo.json'
import TrustSetFrozenOff from './tx/trustSetFrozenOff.json'
import TrustSetNoQuality from './tx/trustSetNoQuality.json'
import Unrecognized from './tx/unrecognized.json'
import WithMemo from './tx/withMemo.json'
import WithMemos from './tx/withMemos.json'
import unsubscribe from './unsubscribe.json'

const submit = {
  success: successSubmit,
  failure: failureSubmit,
}

const ledger = {
  normal: normalLedger,
  normalByHash,
  notFound,
  withoutCloseTime,
  withSettingsTx,
  withStateAsHashes,
  withPartialPayment,
  pre2014withPartial,
}

const subscribe = {
  success: successSubscribe,
  error: errorSubscribe,
}

const streams = {
  ledger: ledgerStream,
  transaction: transactionStream,
  consensus: consensusStream,
  pathFind: pathFindStream,
  peerStatus: peerStatusStream,
  serverStatus: serverStatusStream,
  validation: validationStream,
  manifest: manifestStream,
}

const partial_payments = {
  xrp: xrpPartialPayment,
  iou: iouPartialPayment,
}

const account_objects = {
  normal: normalAccountObjects,
  empty: emptyAccountObjects,
}

const account_info = {
  normal: normalAccountInfo,
  notfound: notfoundAccountInfo,
}

const account_tx = {
  normal: normalAccountTx,
  one: oneAccountTx,
}

const book_offers = {
  fabric,
  usd_xrp,
  xrp_usd,
}

const ledger_data = {
  first_page,
  last_page,
}

const ledger_entry = {
  error: errorLedgerEntry,
}

const server_info = {
  normal: normalServerInfo,
  noValidated,
  syncing,
  error: errorServerInfo,
  reporting,
  highLoadFactor,
}

const path_find = {
  generate,
  sendUSD,
  sendAll,
  XrpToXrp,
  srcActNotFound,
  sourceAmountLow,
}

const payment_channel = {
  normal: normalPayChan,
  full: fullPayChan,
}

const tx = {
  Payment,
  AccountSet,
  AccountSetTrackingOn,
  AccountSetTrackingOff,
  RegularKey,
  OfferCreate,
  OfferCreateWithMemo,
  OfferCreateSell,
  OfferCancel,
  OfferCancelWithMemo,
  TrustSet,
  TrustSetFrozenOff,
  TrustSetNoQuality,
  TrustSetAddMemo,
  NotFound,
  NoLedgerIndex,
  NoLedgerFound,
  LedgerWithoutTime,
  NotValidated,
  OfferWithExpiration,
  CheckCreate,
  CheckCreateWithMemo,
  CheckCancel,
  CheckCancelWithMemo,
  CheckCash,
  CheckCashWithMemo,
  EscrowCreation,
  EscrowCancellation,
  EscrowExecution,
  EscrowExecutionSimple,
  PaymentChannelCreate,
  PaymentChannelCreateWithMemo,
  PaymentChannelFund,
  PaymentChannelFundWithMemo,
  PaymentChannelClaim,
  PaymentChannelClaimWithMemo,
  Unrecognized,
  NoMeta,
  LedgerZero,
  Amendment,
  SetFee,
  SetFeeWithMemo,
  TicketCreateWithMemo,
  DepositPreauthWithMemo,
  AccountDelete,
  AccountDeleteWithMemo,
  WithMemo,
  WithMemos,
}

const rippled = {
  account_info,
  account_objects,
  account_offers,
  account_tx,
  book_offers,
  empty,
  escrow,
  fee,
  gateway_balances,
  ledger,
  ledger_data,
  ledger_entry,
  ledger_current,
  partial_payments,
  path_find,
  payment_channel,
  server_info,
  streams,
  submit,
  subscribe,
  transaction_entry,
  tx,
  unsubscribe,
}

export default rippled
