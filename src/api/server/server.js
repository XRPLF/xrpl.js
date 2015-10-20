/* @flow */

'use strict';

const _ = require('lodash');
const common = require('../common');

type GetServerInfoResponse = {
  buildVersion: string,
  completeLedgers: string,
  hostid: string,
  ioLatencyMs: number,
  load?: {
    jobTypes: Array<Object>,
    threads: number
  },
  lastClose: {
    convergeTimeS: number,
    proposers: number
  },
  loadFactor: number,
  peers: number,
  pubkeyNode: string,
  pubkeyValidator?: string,
  serverState: string,
  validatedLedger: {
    age: number,
    baseFeeXrp: number,
    hash: string,
    reserveBaseXrp: number,
    reserveIncXrp: number,
    seq: number
  },
  validationQuorum: number
}

function isConnected(): boolean {
  const server = this.remote.getServer();
  return Boolean(server && server.isConnected());
}

function getServerInfoAsync(
  callback: (err: any, data?: GetServerInfoResponse) => void
): void {
  this.remote.requestServerInfo((error, response) => {
    if (error) {
      const message = _.get(error, ['remote', 'error_message'], error.message);
      callback(new common.errors.RippledNetworkError(message));
    } else {
      callback(null,
        common.convertKeysFromSnakeCaseToCamelCase(response.info));
    }
  });
}

function getFee(): ?number {
  if (!this.remote.getConnectedServers().length) {
    throw new common.errors.RippledNetworkError('No servers available.');
  }
  const fee = this.remote.createTransaction()._computeFee();
  return fee === undefined ? undefined : common.dropsToXrp(fee);
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
  return common.promisify(getServerInfoAsync).call(this);
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
