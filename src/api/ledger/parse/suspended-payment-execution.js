/* @flow */
'use strict';
const assert = require('assert');
const sjclcodec = require('sjcl-codec');
const utils = require('./utils');

function convertHexToString(hexString) {
  const bits = sjclcodec.hex.toBits(hexString);
  return sjclcodec.utf8String.fromBits(bits);
}

function parseSuspendedPaymentExecution(tx: Object): Object {
  assert(tx.TransactionType === 'SuspendedPaymentFinish');

  return utils.removeUndefined({
    memos: utils.parseMemos(tx),
    owner: tx.Owner,
    paymentSequence: tx.OfferSequence,
    method: tx.Method,
    digest: tx.Digest,
    proof: tx.Proof ? convertHexToString(tx.Proof) : undefined
  });
}

module.exports = parseSuspendedPaymentExecution;
