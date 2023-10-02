import normalAccountInfo from './accountInfo.json'
import emptyAccountObjects from './accountObjectsEmpty.json'
import normalAccountObjects from './accountObjectsNormal.json'
import normalAccountTx from './accountTx.json'
import fabric from './bookOffers'
import usd_xrp from './bookOffersUsdXrp.json'
import xrp_usd from './bookOffersXrpUsd.json'
import normalLedger from './ledger.json'
import first_page from './ledgerDataFirstPage.json'
import last_page from './ledgerDataLastPage.json'
import iouPartialPayment from './partialPaymentIOU.json'
import xrpPartialPayment from './partialPaymentXRP.json'
import normalServerInfo from './serverInfo.json'
import highLoadFactor from './serverInfoHighLoadFactor.json'
import withNetworkIDServerInfo from './serverInfoNetworkID.json'
import consensusStream from './streams/consensusPhase.json'
import ledgerStream from './streams/ledger.json'
import manifestStream from './streams/manifest.json'
import partialPaymentTransactionStream from './streams/partialPaymentTransaction.json'
import pathFindStream from './streams/pathFind.json'
import peerStatusStream from './streams/peerStatusChange.json'
import transactionStream from './streams/transaction.json'
import validationStream from './streams/validation.json'
import successSubmit from './submit.json'
import successSubscribe from './subscribe.json'
import errorSubscribe from './subscribeError.json'
import transaction_entry from './transactionEntry.json'
import NFTokenMint from './tx/NFTokenMint.json'
import NFTokenMint2 from './tx/NFTokenMint2.json'
import OfferCreateSell from './tx/offerCreateSell.json'
import Payment from './tx/payment.json'
import XChainCreateClaimID from './tx/XChainCreateClaimID.json'
import XChainCreateClaimID2 from './tx/XChainCreateClaimID2.json'
import unsubscribe from './unsubscribe.json'

const submit = {
  success: successSubmit,
}

const ledger = {
  normal: normalLedger,
}

const subscribe = {
  success: successSubscribe,
  error: errorSubscribe,
}

const streams = {
  ledger: ledgerStream,
  transaction: transactionStream,
  partialPaymentTransaction: partialPaymentTransactionStream,
  consensus: consensusStream,
  pathFind: pathFindStream,
  peerStatus: peerStatusStream,
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
}

const account_tx = {
  normal: normalAccountTx,
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

const server_info = {
  normal: normalServerInfo,
  highLoadFactor,
  withNetworkId: withNetworkIDServerInfo,
}

const tx = {
  NFTokenMint,
  NFTokenMint2,
  Payment,
  OfferCreateSell,
  XChainCreateClaimID,
  XChainCreateClaimID2,
}

const rippled = {
  account_info,
  account_objects,
  account_tx,
  book_offers,
  ledger,
  ledger_data,
  partial_payments,
  server_info,
  streams,
  submit,
  subscribe,
  transaction_entry,
  tx,
  unsubscribe,
}

export default rippled
