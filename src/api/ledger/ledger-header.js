/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
const composeAsync = utils.common.composeAsync;

function formatLedgerHeader(response) {
  const header = response.ledger;
  return {
    accepted: header.accepted,
    closed: header.closed,
    accountHash: header.account_hash,
    closeTime: header.close_time,
    closeTimeResolution: header.close_time_resolution,
    closeFlags: header.close_flags,
    ledgerHash: header.hash || header.ledger_hash,
    ledgerVersion: parseInt(header.ledger_index || header.seqNum, 10),
    parentLedgerHash: header.parent_hash,
    parentCloseTime: header.parent_close_time,
    totalDrops: header.total_coins || header.totalCoins,
    transactionHash: header.transaction_hash
  };
}

function getLedgerHeaderAsync(ledgerVersion, callback) {
  if (ledgerVersion) {
    validate.ledgerVersion(ledgerVersion);
  }

  const request = {
    ledger: ledgerVersion || 'validated'
  };

  this.remote.requestLedger(request,
    composeAsync(formatLedgerHeader, callback));
}

function getLedgerHeader(ledgerVersion?: number) {
  return utils.promisify(getLedgerHeaderAsync.bind(this))(ledgerVersion);
}

module.exports = getLedgerHeader;
