/* @flow */
'use strict';
const common = require('../common');
import type {GetServerInfoResponse} from '../common/serverinfo';

function isConnected(): boolean {
  const server = this.remote.getServer();
  return Boolean(server && server.isConnected());
}

function getLedgerVersion(): Promise<number> {
  return common.promisify(this.remote.getLedgerSequence).call(this.remote);
}

function connect(): Promise<void> {
  return common.promisify(callback => {
    try {
      this.remote.connect(() => callback(null));
    } catch (error) {
      callback(new common.errors.RippledNetworkError(error.message));
    }
  })();
}

function disconnect(): Promise<void> {
  return common.promisify(callback => {
    try {
      this.remote.disconnect(() => callback(null));
    } catch (error) {
      callback(new common.errors.RippledNetworkError(error.message));
    }
  })();
}

function getServerInfo(): Promise<GetServerInfoResponse> {
  return common.serverInfo.getServerInfo(this.remote);
}

function getFee(): Promise<number> {
  const cushion = this._feeCushion || 1.2;
  return common.serverInfo.getFee(this.remote, cushion);
}

function rippleTimeToISO8601(rippleTime: string): string {
  return new Date(common.core.utils.toTimestamp(rippleTime)).toISOString();
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
