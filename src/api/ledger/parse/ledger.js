/* @flow */
'use strict';
const _ = require('lodash');
const removeUndefined = require('./utils').removeUndefined;
const parseTransaction = require('./transaction');

function parseTransactions(transactions) {
  if (_.isEmpty(transactions)) {
    return {};
  }
  if (_.isString(transactions[0])) {
    return {transactionHashes: transactions};
  }
  return {
    transactions: _.map(transactions, parseTransaction),
    rawTransactions: JSON.stringify(transactions)
  };
}

function parseAccounts(accounts) {
  if (_.isEmpty(accounts)) {
    return {};
  }
  if (_.isString(accounts[0])) {
    return {accountHashes: accounts};
  }
  return {rawAccounts: JSON.stringify(accounts)};
}

function parseLedger(ledger: Object): Object {
  return removeUndefined(_.assign({
    accepted: ledger.accepted,
    closed: ledger.closed,
    accountHash: ledger.account_hash,
    closeTime: ledger.close_time,
    closeTimeResolution: ledger.close_time_resolution,
    closeFlags: ledger.close_flags,
    ledgerHash: ledger.hash || ledger.ledger_hash,
    ledgerVersion: parseInt(ledger.ledger_index || ledger.seqNum, 10),
    parentLedgerHash: ledger.parent_hash,
    parentCloseTime: ledger.parent_close_time,
    totalDrops: ledger.total_coins || ledger.totalCoins,
    transactionHash: ledger.transaction_hash
  },
  parseTransactions(ledger.transactions),
  parseAccounts(ledger.accountState)
  ));
}

module.exports = parseLedger;
