import generateAddress from './generateAddress.json'
import generateFaucetWallet from './generateFaucetWallet.json'
import generateXAddress from './generateXAddress.json'
import getAccountInfo from './getAccountInfo.json'
import getAccountObjects from './getAccountObjects.json'
import getBalances from './getBalances.json'
import getBalanceSheet from './getBalanceSheet.json'
import header from './getLedger.json'
import headerByHash from './getLedgerByHash.json'
import fullLedger from './getLedgerFull.json'
import pre2014withPartial from './getLedgerPre2014WithPartial.json'
import withPartial from './getLedgerWithPartialPayment.json'
import withSettingsTx from './getLedgerWithSettingsTx.json'
import withStateAsHashes from './getLedgerWithStateAsHashes.json'
import normalOrderBook from './getOrderbook.json'
import withXRPOrderBook from './getOrderbookWithXrp.json'
import getOrders from './getOrders.json'
import normalPayChan from './getPaymentChannel.json'
import fullPayChan from './getPaymentChannelFull.json'
import getServerInfo from './getServerInfo.json'
import getSettings from './getSettings.json'
import accountDelete from './getTransactionAccountDelete.json'
import accountDeleteWithMemo from './getTransactionAccountDeleteWithMemo.json'
import amendment from './getTransactionAmendment.json'
import checkCancel from './getTransactionCheckCancel.json'
import checkCancelWithMemo from './getTransactionCheckCancelWithMemo.json'
import checkCash from './getTransactionCheckCash.json'
import checkCashWithMemo from './getTransactionCheckCashWithMemo.json'
import checkCreate from './getTransactionCheckCreate.json'
import checkCreateWithMemo from './getTransactionCheckCreateWithMemo.json'
import depositPreauthWithMemo from './getTransactionDepositPreauthWithMemo.json'
import escrowCancellation from './getTransactionEscrowCancellation.json'
import escrowCreation from './getTransactionEscrowCreation.json'
import escrowExecution from './getTransactionEscrowExecution.json'
import escrowExecutionSimple from './getTransactionEscrowExecutionSimple.json'
import feeUpdate from './getTransactionFeeUpdate.json'
import feeUpdateWithMemo from './getTransactionFeeUpdateWithMemo.json'
import noMeta from './getTransactionNoMeta.json'
import notValidated from './getTransactionNotValidated.json'
import order from './getTransactionOrder.json'
import orderCancellation from './getTransactionOrderCancellation.json'
import orderCancellationWithMemo from './getTransactionOrderCancellationWithMemo.json'
import orderSell from './getTransactionOrderSell.json'
import orderWithExpirationCancellation from './getTransactionOrderWithExpirationCancellation.json'
import orderWithMemo from './getTransactionOrderWithMemo.json'
import payment from './getTransactionPayment.json'
import paymentChannelClaim from './getTransactionPaymentChannelClaim.json'
import paymentChannelClaimWithMemo from './getTransactionPaymentChannelClaimWithMemo.json'
import paymentChannelCreate from './getTransactionPaymentChannelCreate.json'
import paymentChannelCreateWithMemo from './getTransactionPaymentChannelCreateWithMemo.json'
import paymentChannelFund from './getTransactionPaymentChannelFund.json'
import paymentChannelFundWithMemo from './getTransactionPaymentChannelFundWithMemo.json'
import paymentIncludeRawTransaction from './getTransactionPaymentIncludeRawTransaction.json'
import normalTransactions from './getTransactions.json'
import settings from './getTransactionSettings.json'
import setRegularKey from './getTransactionSettingsSetRegularKey.json'
import trackingOff from './getTransactionSettingsTrackingOff.json'
import trackingOn from './getTransactionSettingsTrackingOn.json'
import includeRawTransactions from './getTransactionsIncludeRawTransactions.json'
import oneTransaction from './getTransactionsOne.json'
import ticketCreateWithMemo from './getTransactionTicketCreateWithMemo.json'
import trustlineAddMemo from './getTransactionTrustAddMemo.json'
import trustline from './getTransactionTrustlineSet.json'
import trustlineNoQuality from './getTransactionTrustNoQuality.json'
import trustlineFrozenOff from './getTransactionTrustSetFrozenOff.json'
import withMemo from './getTransactionWithMemo.json'
import withMemos from './getTransactionWithMemos.json'
import ledgerEvent from './ledgerEvent.json'
import ticketCheckCancel from './prepareCheckCancelTicket.json'
import ticketCheckCash from './prepareCheckCashTicket.json'
import ticketCheckCreate from './prepareCheckCreateTicket.json'
import ticketEscrowCancel from './prepareEscrowCancellationTicket.json'
import ticketEscrowCreate from './prepareEscrowCreationTicket.json'
import ticketEscrowExec from './prepareEscrowExecutionTicket.json'
import noInstructionsCancel from './prepareOrderCancellationNoInstructions.json'
import ticketCancel from './prepareOrderCancellationTicket.json'
import ticketOrder from './prepareOrderTicket.json'
import ticketPayChanClaim from './preparePaymentChannelClaimTicket.json'
import ticketPayChanCreate from './preparePaymentChannelCreateTicket.json'
import ticketPayChanFund from './preparePaymentChannelFundTicket.json'
import ticketPayment from './preparePaymentTicket.json'
import ticketSequencePayment from './preparePaymentTicketSequence.json'
import fieldClear from './prepareSettingsFieldClear.json'
import flagClear from './prepareSettingsFlagClear.json'
import flagClearDepositAuth from './prepareSettingsFlagClearDepositAuth.json'
import flagSet from './prepareSettingsFlagSet.json'
import flagSetDepositAuth from './prepareSettingsFlagSetDepositAuth.json'
import flagsMultisign from './prepareSettingsMultisign.json'
import noInstructions from './prepareSettingsNoInstructions.json'
import noMaxLedgerVersion from './prepareSettingsNoMaxledgerversion.json'
import noSignerList from './prepareSettingsNoSignerList.json'
import noWeights from './prepareSettingsNoWeight.json'
import regularKey from './prepareSettingsRegularKey.json'
import removeRegularKey from './prepareSettingsRemoveRegularKey.json'
import setTransferRate from './prepareSettingsSetTransferRate.json'
import signedSettings from './prepareSettingsSigned.json'
import ticketSettings from './prepareSettingsTicket.json'
import ticketTrustline from './prepareTrustlineTicket.json'
import normalSign from './sign.json'
import signAsSign from './signAs.json'
import escrowSign from './signEscrow.json'
import signPaymentChannelClaim from './signPaymentChannelClaim.json'
import ticketSign from './signTicket.json'
import submit from './submit.json'

const getPaymentChannel = {
  normal: normalPayChan,
  full: fullPayChan,
}

const getOrderbook = {
  normal: normalOrderBook,
  withXRP: withXRPOrderBook,
}

const getTransaction = {
  orderCancellation,
  orderCancellationWithMemo,
  orderWithExpirationCancellation,
  order,
  orderWithMemo,
  orderSell,
  noMeta,
  payment,
  paymentIncludeRawTransaction,
  settings,
  trustline,
  trackingOn,
  trackingOff,
  setRegularKey,
  trustlineFrozenOff,
  trustlineNoQuality,
  trustlineAddMemo,
  notValidated,
  checkCreate,
  checkCreateWithMemo,
  checkCancel,
  checkCancelWithMemo,
  checkCash,
  checkCashWithMemo,
  depositPreauthWithMemo,
  escrowCreation,
  escrowCancellation,
  escrowExecution,
  escrowExecutionSimple,
  paymentChannelCreate,
  paymentChannelCreateWithMemo,
  paymentChannelFund,
  paymentChannelFundWithMemo,
  paymentChannelClaim,
  paymentChannelClaimWithMemo,
  amendment,
  feeUpdate,
  feeUpdateWithMemo,
  accountDelete,
  accountDeleteWithMemo,
  ticketCreateWithMemo,
  withMemo,
  withMemos,
}

const getTransactions = {
  normal: normalTransactions,
  includeRawTransactions,
  one: oneTransaction,
}

const getLedger = {
  header,
  headerByHash,
  full: fullLedger,
  withSettingsTx,
  withStateAsHashes,
  withPartial,
  pre2014withPartial,
}

const prepareOrder = {
  ticket: ticketOrder,
}

const prepareOrderCancellation = {
  ticket: ticketCancel,
  noInstructions: noInstructionsCancel,
}

const preparePayment = {
  ticket: ticketPayment,
  ticketSequence: ticketSequencePayment,
}

const prepareSettings = {
  regularKey,
  removeRegularKey,
  ticket: ticketSettings,
  flagsMultisign,
  flagSet,
  flagClear,
  flagSetDepositAuth,
  flagClearDepositAuth,
  setTransferRate,
  fieldClear,
  noInstructions,
  signed: signedSettings,
  noMaxLedgerVersion,
  noSignerList,
  noWeights,
}

const prepareCheckCreate = {
  ticket: ticketCheckCreate,
}

const prepareCheckCash = {
  ticket: ticketCheckCash,
}

const prepareCheckCancel = {
  ticket: ticketCheckCancel,
}

const prepareEscrowCreation = {
  ticket: ticketEscrowCreate,
}

const prepareEscrowExecution = {
  ticket: ticketEscrowExec,
}

const prepareEscrowCancellation = {
  ticket: ticketEscrowCancel,
}

const preparePaymentChannelCreate = {
  ticket: ticketPayChanCreate,
}

const preparePaymentChannelFund = {
  ticket: ticketPayChanFund,
}

const preparePaymentChannelClaim = {
  ticket: ticketPayChanClaim,
}

const prepareTrustline = {
  ticket: ticketTrustline,
}

const sign = {
  normal: normalSign,
  ticket: ticketSign,
  escrow: escrowSign,
  signAs: signAsSign,
}

const responses = {
  generateAddress,
  generateFaucetWallet,
  generateXAddress,
  getAccountInfo,
  getAccountObjects,
  getBalanceSheet,
  getBalances,
  getOrders,
  getServerInfo,
  getSettings,
  ledgerEvent,
  signPaymentChannelClaim,
  submit,
  getPaymentChannel,
  getOrderbook,
  getTransaction,
  getTransactions,
  getLedger,
  prepareOrder,
  prepareOrderCancellation,
  preparePayment,
  prepareSettings,
  prepareCheckCreate,
  prepareCheckCash,
  prepareCheckCancel,
  prepareEscrowCreation,
  prepareEscrowExecution,
  prepareEscrowCancellation,
  preparePaymentChannelCreate,
  preparePaymentChannelFund,
  preparePaymentChannelClaim,
  prepareTrustline,
  sign,
}

export default responses
