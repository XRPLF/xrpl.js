import {parseOutcome} from './utils'
import {removeUndefined} from '../../common'
import parsePayment from './payment'
import parseTrustline from './trustline'
import parseOrder from './order'
import parseOrderCancellation from './cancellation'
import parseSettings from './settings'
import parseEscrowCreation from './escrow-creation'
import parseEscrowExecution from './escrow-execution'
import parseEscrowCancellation from './escrow-cancellation'
import parseCheckCreate from './check-create'
import parseCheckCash from './check-cash'
import parseCheckCancel from './check-cancel'
import parseDepositPreauth from './deposit-preauth'
import parsePaymentChannelCreate from './payment-channel-create'
import parsePaymentChannelFund from './payment-channel-fund'
import parsePaymentChannelClaim from './payment-channel-claim'
import parseFeeUpdate from './fee-update'
import parseAmendment from './amendment'

function parseTransactionType(type) {
  // Ordering matches https://developers.ripple.com/transaction-types.html
  const mapping = {
    AccountSet: 'settings',
    CheckCancel: 'checkCancel',
    CheckCash: 'checkCash',
    CheckCreate: 'checkCreate',
    DepositPreauth: 'depositPreauth',
    EscrowCancel: 'escrowCancellation',
    EscrowCreate: 'escrowCreation',
    EscrowFinish: 'escrowExecution',
    OfferCancel: 'orderCancellation',
    OfferCreate: 'order',
    Payment: 'payment',
    PaymentChannelClaim: 'paymentChannelClaim',
    PaymentChannelCreate: 'paymentChannelCreate',
    PaymentChannelFund: 'paymentChannelFund',
    SetRegularKey: 'settings',
    SignerListSet: 'settings',
    TrustSet: 'trustline',

    EnableAmendment: 'amendment', // pseudo-transaction
    SetFee: 'feeUpdate' // pseudo-transaction
  }
  return mapping[type] || null
}

// includeRawTransaction: undefined by default (getTransaction)
function parseTransaction(tx: any, includeRawTransaction: boolean): any {
  const type = parseTransactionType(tx.TransactionType)
  const mapping = {
    'payment': parsePayment,
    'trustline': parseTrustline,
    'order': parseOrder,
    'orderCancellation': parseOrderCancellation,
    'settings': parseSettings,
    'escrowCreation': parseEscrowCreation,
    'escrowExecution': parseEscrowExecution,
    'escrowCancellation': parseEscrowCancellation,
    'checkCreate': parseCheckCreate,
    'checkCash': parseCheckCash,
    'checkCancel': parseCheckCancel,
    'depositPreauth': parseDepositPreauth,
    'paymentChannelCreate': parsePaymentChannelCreate,
    'paymentChannelFund': parsePaymentChannelFund,
    'paymentChannelClaim': parsePaymentChannelClaim,
    'feeUpdate': parseFeeUpdate,
    'amendment': parseAmendment
  }
  const parser: Function = mapping[type]

  const specification = parser ? parser(tx) : {
    UNAVAILABLE: 'Unrecognized transaction type.',
    SEE_RAW_TRANSACTION: 'Since this type is unrecognized, `rawTransaction` is included in this response.'
  }
  if (!parser) {
    includeRawTransaction = true
  }

  const outcome = parseOutcome(tx)
  return removeUndefined({
    type: type,
    address: tx.Account,
    sequence: tx.Sequence,
    id: tx.hash,
    specification: removeUndefined(specification),
    outcome: outcome ? removeUndefined(outcome) : undefined,
    rawTransaction: includeRawTransaction ? JSON.stringify(tx) : undefined
  })
}

export default parseTransaction
