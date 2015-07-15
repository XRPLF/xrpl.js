/* @flow */
'use strict';
const utils = require('./utils');
const validate = utils.common.validate;

const TrustSetFlags = {
  authorized: {set: 'SetAuth'},
  allowRippling: {set: 'ClearNoRipple', unset: 'NoRipple'},
  frozen: {set: 'SetFreeze', unset: 'ClearFreeze'}
};

function createTrustlineTransaction(account, trustline) {
  validate.address(account);
  validate.trustline(trustline);

  const limit = {
    currency: trustline.currency,
    issuer: trustline.counterparty,
    value: trustline.limit
  };

  const transaction = new utils.common.core.Transaction();
  transaction.trustSet(account, limit,
    trustline.qualityIn, trustline.qualityOut);
  utils.setTransactionBitFlags(transaction, trustline, TrustSetFlags);
  return transaction;
}

function prepareTrustline(account, trustline, instructions, callback) {
  const transaction = createTrustlineTransaction(account, trustline);
  utils.createTxJSON(transaction, this.remote, instructions, callback);
}

module.exports = utils.wrapCatch(prepareTrustline);
