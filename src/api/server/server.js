'use strict';
const common = require('../common');

// If a ledger is not received in this time, consider the connection offline
const CONNECTION_TIMEOUT = 1000 * 30;

function connect(callback) {
  this.remote.connect(callback);
}

function disconnect(callback) {
  this.remote.disconnect(callback);
}

function isUpToDate(remote) {
  const server = remote.getServer();
  return Boolean(server) && (remote._stand_alone
    || (Date.now() - server._lastLedgerClose) <= CONNECTION_TIMEOUT);
}

function isConnected() {
  return Boolean(this.remote._ledger_current_index) && isUpToDate(this.remote);
}

function getServerInfo(callback) {
  this.remote.requestServerInfo((error, response) => {
    if (error) {
      callback(new common.errors.RippledNetworkError(error.message));
    } else {
      callback(null, response.info);
    }
  });
}

function getFee() {
  return common.dropsToXrp(this.remote.createTransaction()._computeFee());
}

function getLedgerVersion() {
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
