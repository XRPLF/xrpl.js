'use strict';
const assert = require('assert');
const utils = require('./utils');
const flags = utils.core.Transaction.flags.TrustSet;

function parseTrustline(tx) {
  assert(tx.TransactionType === 'TrustSet');

  return {
    limit: tx.LimitAmount.value,
    currency: tx.LimitAmount.currency,
    counterparty: tx.LimitAmount.issuer,
    qualityIn: tx.QualityIn,
    qualityOut: tx.QualityOut,
    allowRippling: tx.Flags & flags.NoRipple === 0,
    frozen: tx.Flags & flags.SetFreeze !== 0,
    authorized: tx.Flags & flags.SetAuth !== 0
  };
}

module.exports = parseTrustline;
