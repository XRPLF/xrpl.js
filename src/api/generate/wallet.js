'use strict';
const common = require('../common');

function generateWallet(callback) {
  const wallet = common.core.Wallet.generate();
  if (wallet) {
    callback(null, {wallet: wallet});
  } else {
    callback(new common.errors.ApiError('Could not generate wallet'));
  }
}

module.exports = generateWallet;
