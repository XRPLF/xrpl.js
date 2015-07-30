/* @flow */

'use strict';

const _ = require('lodash');
const common = require('../common');

// If a ledger is not received in this time, consider the connection offline
const CONNECTION_TIMEOUT = 1000 * 30;

function connect(callback: (err: any, data: any) => void): void {
  this.remote.connect(callback);
}

function disconnect(callback: (err: any, data: any) => void): void {
  this.remote.disconnect(callback);
}

function isUpToDate(remote): boolean {
  const server = remote.getServer();
  return Boolean(server) && (remote._stand_alone
    || (Date.now() - server._lastLedgerClose) <= CONNECTION_TIMEOUT);
}

function isConnected(): boolean {
  return Boolean(this.remote._ledger_current_index) && isUpToDate(this.remote);
}

function getServerInfo(callback: (err: any, data: any) => void): void {
  this.remote.requestServerInfo((error, response) => {
    if (error) {
      const message = _.get(error, ['remote', 'error_message'], error.message);
      callback(new common.errors.RippledNetworkError(message));
    } else {
      callback(null, common.convertKeysFromSnakeCaseToCamelCase(response.info));
    }
  });
}

function getFee(): number {
  return common.dropsToXrp(this.remote.createTransaction()._computeFee());
}

function getLedgerVersion(): number {
  return this.remote.getLedgerSequence();
}

module.exports = {
  connect,
  disconnect,
  isConnected,
  getServerInfo,
  getFee,
  getLedgerVersion
};
