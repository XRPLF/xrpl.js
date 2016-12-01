/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const {removeUndefined, rippleTimeToISO8601} = require('./utils')
const parseTransaction = require('./transaction')
import type {GetLedger} from '../types.js'

function parseTransactionWrapper(ledgerVersion, tx) {
  const transaction = _.assign({}, _.omit(tx, 'metaData'), {
    meta: tx.metaData,
    ledger_index: ledgerVersion
  })
  const result = parseTransaction(transaction)
  if (!result.outcome.ledgerVersion) {
    result.outcome.ledgerVersion = ledgerVersion
  }
  return result
}

function parseTransactions(transactions, ledgerVersion) {
  if (_.isEmpty(transactions)) {
    return {}
  }
  if (_.isString(transactions[0])) {
    return {transactionHashes: transactions}
  }
  return {
    transactions: _.map(transactions,
      _.partial(parseTransactionWrapper, ledgerVersion)),
    rawTransactions: JSON.stringify(transactions)
  }
}

function parseState(state) {
  if (_.isEmpty(state)) {
    return {}
  }
  if (_.isString(state[0])) {
    return {stateHashes: state}
  }
  return {rawState: JSON.stringify(state)}
}

function parseLedger(ledger: Object): GetLedger {
  const ledgerVersion = parseInt(ledger.ledger_index || ledger.seqNum, 10)
  return removeUndefined(_.assign({
    stateHash: ledger.account_hash,
    closeTime: rippleTimeToISO8601(ledger.close_time),
    closeTimeResolution: ledger.close_time_resolution,
    closeFlags: ledger.close_flags,
    ledgerHash: ledger.hash || ledger.ledger_hash,
    ledgerVersion: ledgerVersion,
    parentLedgerHash: ledger.parent_hash,
    parentCloseTime: rippleTimeToISO8601(ledger.parent_close_time),
    totalDrops: ledger.total_coins || ledger.totalCoins,
    transactionHash: ledger.transaction_hash
  },
  parseTransactions(ledger.transactions, ledgerVersion),
  parseState(ledger.accountState)
  ))
}

module.exports = parseLedger
