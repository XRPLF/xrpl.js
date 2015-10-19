/* @flow */
'use strict';
const _ = require('lodash');
const async = require('async');
const BigNumber = require('bignumber.js');
const common = require('../common');
const composeAsync = common.composeAsync;
const txFlags = require('./txflags');
import type {Remote} from '../../core/remote';
import type {Transaction} from '../../core/transaction';
import type {Instructions} from './types.js';

function setTransactionBitFlags(transaction: Transaction, values: any,
    flags: any
): void {
  for (const flagName in flags) {
    const flagValue = values[flagName];
    const flagConversions = flags[flagName];

    if (flagValue === true && flagConversions.set !== undefined) {
      transaction.setFlags(flagConversions.set);
    }
    if (flagValue === false && flagConversions.unset !== undefined) {
      transaction.setFlags(flagConversions.unset);
    }
  }
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
  txJSON.Flags |= txFlags.transactionFlags.Universal.FullyCanonicalSig;

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

module.exports = {
  setTransactionBitFlags,
  prepareTransaction,
  common,
  promisify: common.promisify
};
