/* @flow */
'use strict';
const _ = require('lodash');
const async = require('async');
const BigNumber = require('bignumber.js');
const common = require('../common');
const composeAsync = common.composeAsync;
const txFlags = common.txFlags;
import type {Remote} from '../../core/remote';
import type {Instructions} from './types.js';

function removeUndefined(obj: Object): Object {
  return _.omit(obj, _.isUndefined);
}

function getFeeDrops(remote: Remote, callback) {
  const feeUnits = 10; // all transactions currently have a fee of 10 fee units
  remote.feeTxAsync(feeUnits, (err, data) => {
    callback(err, data ? data.to_text() : undefined);
  });
}

function formatPrepareResponse(txJSON: Object): Object {
  const instructions = {
    fee: txJSON.Fee,
    sequence: txJSON.Sequence,
    maxLedgerVersion: txJSON.LastLedgerSequence
  };
  return {
    txJSON: JSON.stringify(txJSON),
    instructions: _.omit(instructions, _.isUndefined)
  };
}

function setCanonicalFlag(txJSON) {
  txJSON.Flags |= txFlags.Universal.FullyCanonicalSig;

  // JavaScript converts operands to 32-bit signed ints before doing bitwise
  // operations. We need to convert it back to an unsigned int.
  txJSON.Flags = txJSON.Flags >>> 0;
}

type Callback = (err: ?(typeof Error),
                 data: {txJSON: string, instructions: Instructions}) => void;
function prepareTransaction(txJSON: Object, remote: Remote,
    instructions: Instructions, callback: Callback
): void {
  common.validate.instructions(instructions);

  const account = txJSON.Account;
  setCanonicalFlag(txJSON);

  function prepareMaxLedgerVersion(callback_) {
    if (instructions.maxLedgerVersion !== undefined) {
      txJSON.LastLedgerSequence = instructions.maxLedgerVersion;
      callback_();
    } else {
      const offset = instructions.maxLedgerVersionOffset !== undefined ?
        instructions.maxLedgerVersionOffset : 3;
      remote.getLedgerSequence((error, ledgerVersion) => {
        txJSON.LastLedgerSequence = ledgerVersion + offset;
        callback_(error);
      });
    }
  }

  function prepareFee(callback_) {
    if (instructions.fee !== undefined) {
      txJSON.Fee = common.xrpToDrops(instructions.fee);
      callback_();
    } else {
      getFeeDrops(remote, composeAsync((serverFeeDrops) => {
        if (instructions.maxFee !== undefined) {
          const maxFeeDrops = common.xrpToDrops(instructions.maxFee);
          txJSON.Fee = BigNumber.min(serverFeeDrops, maxFeeDrops).toString();
        } else {
          txJSON.Fee = serverFeeDrops;
        }
      }, callback_));
    }
  }

  function prepareSequence(callback_) {
    if (instructions.sequence !== undefined) {
      txJSON.Sequence = instructions.sequence;
      callback_(null, formatPrepareResponse(txJSON));
    } else {
      remote.findAccount(account).getNextSequence(function(error, sequence) {
        txJSON.Sequence = sequence;
        callback_(error, formatPrepareResponse(txJSON));
      });
    }
  }

  async.series([
    prepareMaxLedgerVersion,
    prepareFee,
    prepareSequence
  ], common.convertErrors(function(error, results) {
    callback(error, results && results[2]);
  }));
}

function convertStringToHex(string: string) {
  return string ? (new Buffer(string, 'utf8')).toString('hex').toUpperCase() :
    undefined;
}

function convertMemo(memo: Object): Object {
  return {
    Memo: removeUndefined({
      MemoData: convertStringToHex(memo.data),
      MemoType: convertStringToHex(memo.type),
      MemoFormat: convertStringToHex(memo.format)
    })
  };
}

/**
 * @param {Number} rpepoch (seconds since 1/1/2000 GMT)
 * @return {Number} ms since unix epoch
 *
 */
function toTimestamp(rpepoch: number): number {
  return (rpepoch + 0x386D4380) * 1000;
}

/**
 * @param {Number|Date} timestamp (ms since unix epoch)
 * @return {Number} seconds since ripple epoch ( 1/1/2000 GMT)
 */
function fromTimestamp(timestamp: number | Date): number {
  const timestamp_ = timestamp instanceof Date ?
                     timestamp.getTime() :
                     timestamp;
  return Math.round(timestamp_ / 1000) - 0x386D4380;
}

module.exports = {
  removeUndefined,
  convertStringToHex,
  fromTimestamp,
  toTimestamp,
  convertMemo,
  prepareTransaction,
  common,
  promisify: common.promisify
};
