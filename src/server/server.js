/* @flow */
'use strict';
const common = require('../common');
import type {GetServerInfoResponse} from '../common/serverinfo';

function isConnected(): boolean {
  return this.connection.isConnected();
}

function getLedgerVersion(): Promise<number> {
  return this.connection.getLedgerVersion();
}

function connect(): Promise<void> {
  return this.connection.connect();
}

function disconnect(): Promise<void> {
  return this.connection.disconnect();
}

function getServerInfo(): Promise<GetServerInfoResponse> {
  return common.serverInfo.getServerInfo(this.connection);
}

function getFee(): Promise<number> {
  const cushion = this._feeCushion || 1.2;
  return common.serverInfo.getFee(this.connection, cushion);
}

function formatLedgerClose(ledgerClose: Object): Object {
  return {
    baseFeeXRP: common.dropsToXrp(ledgerClose.fee_base),
    ledgerHash: ledgerClose.ledger_hash,
    ledgerVersion: ledgerClose.ledger_index,
    ledgerTimestamp: common.rippleTimeToISO8601(ledgerClose.ledger_time),
    reserveBaseXRP: common.dropsToXrp(ledgerClose.reserve_base),
    reserveIncrementXRP: common.dropsToXrp(ledgerClose.reserve_inc),
    transactionCount: ledgerClose.txn_count,
    validatedLedgerVersions: ledgerClose.validated_ledgers
  };
}

module.exports = {
  connect,
  disconnect,
  isConnected,
  getServerInfo,
  getFee,
  getLedgerVersion,
  formatLedgerClose
};
