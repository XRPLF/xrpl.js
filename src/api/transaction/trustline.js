/* @flow */
'use strict';
const utils = require('./utils');
const ripple = utils.common.core;
const validate = utils.common.validate;

const TrustSetFlags = {
  SetAuth: {name: 'authorized', set: 'SetAuth'},
  ClearNoRipple: {name: 'account_allows_rippling', set: 'ClearNoRipple',
    unset: 'NoRipple'},
  SetFreeze: {name: 'account_trustline_frozen', set: 'SetFreeze',
    unset: 'ClearFreeze'}
};

function createTrustLineTransaction(account, trustline) {
  validate.address(account);
  validate.trustline(trustline);

  if (trustline && trustline.limit) {
    trustline.limit = String(trustline.limit);
  }

  const transaction = new ripple.Transaction();
  const limit = [
    trustline.limit,
    trustline.currency,
    trustline.counterparty
  ].join('/');

  transaction.trustSet(account, limit);

  if (typeof trustline.quality_in === 'number') {
    transaction.tx_json.QualityIn = trustline.quality_in;
  }
  if (typeof trustline.quality_out === 'number') {
    transaction.tx_json.QualityOut = trustline.quality_out;
  }

  utils.setTransactionBitFlags(transaction, {
    input: trustline,
    flags: TrustSetFlags,
    clear_setting: ''
  });
  return transaction;
}

function prepareTrustLine(account, trustline, instructions, callback) {
  const transaction = createTrustLineTransaction(account, trustline);
  utils.createTxJSON(transaction, this.remote, instructions, callback);
}

module.exports = utils.wrapCatch(prepareTrustLine);
