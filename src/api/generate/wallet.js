'use strict';
const common = require('../common');

function generateWallet() {
  const wallet = common.core.Wallet.generate();
  if (!wallet) {
    throw new common.errors.ApiError('Could not generate wallet');
  }
  return wallet;
}

module.exports = generateWallet;
