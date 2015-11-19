/* @flow */
'use strict';
const assert = require('assert');
const utils = require('./utils');
const flags = utils.txFlags.TrustSet;
const BigNumber = require('bignumber.js');

function parseFlag(flagsValue, trueValue, falseValue) {
  if (flagsValue & trueValue) {
    return true;
  }
  if (flagsValue & falseValue) {
    return false;
  }
  return undefined;
}

function parseQuality(quality?: number) {
  if (typeof quality === 'number') {
    return (new BigNumber(quality)).shift(-9).toNumber();
  }
  return undefined;
}

function parseTrustline(tx: Object): Object {
  assert(tx.TransactionType === 'TrustSet');

  return utils.removeUndefined({
    limit: tx.LimitAmount.value,
    currency: tx.LimitAmount.currency,
    counterparty: tx.LimitAmount.issuer,
    qualityIn: parseQuality(tx.QualityIn),
    qualityOut: parseQuality(tx.QualityOut),
    ripplingDisabled: parseFlag(
      tx.Flags, flags.SetNoRipple, flags.ClearNoRipple),
    frozen: parseFlag(tx.Flags, flags.SetFreeze, flags.ClearFreeze),
    authorized: parseFlag(tx.Flags, flags.SetAuth, 0)
  });
}

module.exports = parseTrustline;
