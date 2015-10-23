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

function rippleTimeToISO8601(rippleTime: string): string {
  return new Date(common.toTimestamp(rippleTime)).toISOString();
}

function formatLedgerClose(ledgerClose: Object): Object {
  return {
    feeBase: ledgerClose.fee_base,
    feeReference: ledgerClose.fee_ref,
    ledgerHash: ledgerClose.ledger_hash,
    ledgerVersion: ledgerClose.ledger_index,
    ledgerTimestamp: rippleTimeToISO8601(ledgerClose.ledger_time),
    reserveBase: ledgerClose.reserve_base,
    reserveIncrement: ledgerClose.reserve_inc,
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
