import * as assert from 'assert'
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
import parsePaymentChannelCreate from './payment-channel-create'
import parsePaymentChannelFund from './payment-channel-fund'
import parsePaymentChannelClaim from './payment-channel-claim'
import parseFeeUpdate from './fee-update'
import parseAmendment from './amendment'

function parseTransactionType(type) {
  const mapping = {
    Payment: 'payment',
    TrustSet: 'trustline',
    OfferCreate: 'order',
    OfferCancel: 'orderCancellation',
    AccountSet: 'settings',
    SetRegularKey: 'settings',
    EscrowCreate: 'escrowCreation',
    EscrowFinish: 'escrowExecution',
    EscrowCancel: 'escrowCancellation',
    PaymentChannelCreate: 'paymentChannelCreate',
    PaymentChannelFund: 'paymentChannelFund',
    PaymentChannelClaim: 'paymentChannelClaim',
    SignerListSet: 'settings',
    SetFee: 'feeUpdate', // pseudo-transaction
    EnableAmendment: 'amendment' // pseudo-transaction
  }
  return mapping[type] || null
}

function parseTransaction(tx: any): any {
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
    'paymentChannelCreate': parsePaymentChannelCreate,
    'paymentChannelFund': parsePaymentChannelFund,
    'paymentChannelClaim': parsePaymentChannelClaim,
    'feeUpdate': parseFeeUpdate,
    'amendment': parseAmendment
  }
  const parser: Function = mapping[type]
  assert(parser !== undefined, 'Unrecognized transaction type')
  const specification = parser(tx)
  const outcome = parseOutcome(tx)
  return removeUndefined({
    type: type,
    address: tx.Account,
    sequence: tx.Sequence,
    id: tx.hash,
    specification: removeUndefined(specification),
    outcome: outcome ? removeUndefined(outcome) : undefined
  })
}

export default parseTransaction
