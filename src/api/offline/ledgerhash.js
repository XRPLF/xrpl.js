/* @flow */
'use strict';
const _ = require('lodash');
const common = require('../common');

function convertLedgerHeader(header) {
  return {
    accepted: header.accepted,
    closed: header.closed,
    account_hash: header.accountHash,
    close_time: header.closeTime,
    close_time_resolution: header.closeTimeResolution,
    close_flags: header.closeFlags,
    hash: header.ledgerHash,
    ledger_hash: header.ledgerHash,
    ledger_index: header.ledgerVersion.toString(),
    seqNum: header.ledgerVersion.toString(),
    parent_hash: header.parentLedgerHash,
    parent_close_time: header.parentCloseTime,
    total_coins: header.totalDrops,
    totalCoins: header.totalDrops,
    transaction_hash: header.transactionHash
  };
}

function hashLedgerHeader(ledgerHeader) {
  const header = convertLedgerHeader(ledgerHeader);
  return common.core.Ledger.calculateLedgerHash(header);
}

function computeLedgerHash(ledgerHeader: Object, transactions: Array<Object>
): string {
  if (transactions) {
    const txs = _.map(transactions, tx => {
      const mergeTx = _.assign({}, _.omit(tx, 'tx'), tx.tx || {});
      const renameMeta = _.assign({}, _.omit(mergeTx, 'meta'),
        tx.meta ? {metaData: tx.meta} : {});
      return renameMeta;
    });
    const ledger = common.core.Ledger.from_json({transactions: txs});
    const transactionHash = ledger.calc_tx_hash().to_hex();
    if (ledgerHeader.transaction_hash !== undefined
        && ledgerHeader.transaction_hash !== transactionHash) {
      throw new common.errors.ValidationError('transaction_hash in header'
        + ' does not match computed hash of transactions');
    }
    return hashLedgerHeader(_.assign({}, ledgerHeader, {transactionHash}));
  }
  return hashLedgerHeader(ledgerHeader);
}

module.exports = computeLedgerHash;
