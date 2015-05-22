'use strict';
const common = require('../common');

function connect(callback) {
  this.remote.connect(callback);
}

function isConnected() {
  return common.server.isConnected(this.remote);
}

function getServerStatus(callback) {
  common.server.getStatus(this.remote, function(error, status) {
    if (error) {
      callback(new common.errors.RippledNetworkError(error.message));
    } else {
      callback(null, status);
    }
  });
}

function getFee(callback) {
  const fee = this.remote.createTransaction()._computeFee();
  callback(null, {fee: common.dropsToXrp(fee)});
}


module.exports = {
  connect: connect,
  isConnected: isConnected,
  getServerStatus: getServerStatus,
  getFee: getFee
};
