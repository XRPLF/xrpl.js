/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;
const Transaction = utils.common.core.Transaction;
const BigNumber = require('bignumber.js');

const TrustSetFlags = {
  authorized: {set: 'SetAuth'},
  ripplingDisabled: {set: 'NoRipple', unset: 'ClearNoRipple'},
  frozen: {set: 'SetFreeze', unset: 'ClearFreeze'}
};

function convertQuality(quality) {
  return (new BigNumber(quality)).shift(9).truncated().toNumber();
}

function createTrustlineTransaction(account, trustline) {
  validate.address(account);
  validate.trustline(trustline);

  const limit = {
    currency: trustline.currency,
    issuer: trustline.counterparty,
    value: trustline.limit
  };

  const transaction = new Transaction();
  transaction.trustSet(account, limit, convertQuality(trustline.qualityIn),
    convertQuality(trustline.qualityOut));
  utils.setTransactionBitFlags(transaction, trustline, TrustSetFlags);
  return transaction;
}

function prepareTrustline(account, trustline, instructions, callback) {
  const transaction = createTrustlineTransaction(account, trustline);
  utils.createTxJSON(transaction, this.remote, instructions, callback);
}

module.exports = utils.wrapCatch(prepareTrustline);
