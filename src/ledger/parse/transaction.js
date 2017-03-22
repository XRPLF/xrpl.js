/* @flow */
'use strict' // eslint-disable-line strict
const assert = require('assert')
const utils = require('./utils')
const parsePayment = require('./payment')
const parseTrustline = require('./trustline')
const parseOrder = require('./order')
const parseOrderCancellation = require('./cancellation')
const parseSettings = require('./settings')
const parseEscrowCreation = require('./escrow-creation')
const parseEscrowExecution = require('./escrow-execution')
const parseEscrowCancellation = require('./escrow-cancellation')
const parseFeeUpdate = require('./fee-update')
const parseAmendment = require('./amendment')

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
    SignerListSet: 'settings',
    SetFee: 'feeUpdate',          // pseudo-transaction
    EnableAmendment: 'amendment'  // pseudo-transaction
  }
  return mapping[type] || null
}

function parseTransaction(tx: Object): Object {
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
    'feeUpdate': parseFeeUpdate,
    'amendment': parseAmendment
  }
  const parser = mapping[type]
  assert(parser !== undefined, 'Unrecognized transaction type')
  const specification = parser(tx)
  const outcome = utils.parseOutcome(tx)
  return utils.removeUndefined({
    type: type,
    address: tx.Account,
    sequence: tx.Sequence,
    id: tx.hash,
    specification: utils.removeUndefined(specification),
    outcome: outcome ? utils.removeUndefined(outcome) : undefined
  })
}

module.exports = parseTransaction
