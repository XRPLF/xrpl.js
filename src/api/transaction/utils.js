/* @flow */
/* eslint-disable valid-jsdoc */
'use strict';
const BigNumber = require('bignumber.js');
const common = require('../common');

/**
 * Helper that sets bit flags on transactions
 *
 * @param {Transaction} transaction - Transaction object that is used to submit
 *                                    requests to ripple
 * @param {Object} options
 * @param {Object} options.flags - Holds flag names to set on transaction when
 *                                 parameter values are true or false on input
 * @param {Object} options.input - Holds parameter values
 * @param {String} options.clear_setting - Used to check if parameter values
 *                                         besides false mean false
 *
 *
 * @returns undefined
 */
/*:: type FlagOptions = {flags: any; input: any; clear_setting?: string} */
function setTransactionBitFlags(transaction: any, options: FlagOptions): void {
  for (let flagName in options.flags) {
    const flag = options.flags[flagName];

    // Set transaction flags
    if (!(flag.name in options.input)) {
      continue;
    }

    let value = options.input[flag.name];

    if (value === options.clear_setting) {
      value = false;
    }

    if (flag.unset) {
      transaction.setFlags(value ? flag.set : flag.unset);
    } else if (flag.set && value) {
      transaction.setFlags(flag.set);
    }
  }
}

function getFeeDrops(remote) {
  const feeUnits = 10; // all transactions currently have a fee of 10 fee units
  return remote.feeTx(feeUnits).to_text();
}

/*:: type Callback = (err: typeof Error, data: {tx_json: any}) => void */
function createTxJSON(transaction: any, remote: any,
    instructions: any, callback: Callback): void {
  common.validate.instructions(instructions);

  transaction.complete();
  const account = transaction.getAccount();
  const txJSON = transaction.tx_json;

  if (instructions.maxLedgerVersion !== undefined) {
    txJSON.LastLedgerSequence = parseInt(instructions.maxLedgerVersion, 10);
  } else {
    const offset = instructions.maxLedgerVersionOffset !== undefined ?
      parseInt(instructions.maxLedgerVersionOffset, 10) : 3;
    txJSON.LastLedgerSequence = remote.getLedgerSequence() + offset;
  }

  if (instructions.fee !== undefined) {
    txJSON.Fee = common.xrpToDrops(instructions.fee);
  } else {
    const serverFeeDrops = getFeeDrops(remote);
    if (instructions.maxFee !== undefined) {
      const maxFeeDrops = common.xrpToDrops(instructions.maxFee);
      txJSON.Fee = BigNumber.min(serverFeeDrops, maxFeeDrops).toString();
    } else {
      txJSON.Fee = serverFeeDrops;
    }
  }

  if (instructions.sequence !== undefined) {
    txJSON.Sequence = parseInt(instructions.sequence, 10);
    callback(null, txJSON);
  } else {
    remote.findAccount(account).getNextSequence(function(error, sequence) {
      txJSON.Sequence = sequence;
      callback(null, txJSON);
    });
  }
}

function wrapCatch(asyncFunction: any): any {
  return function() {
    try {
      asyncFunction.apply(this, arguments);
    } catch (error) {
      const callback = arguments[arguments.length - 1];
      callback(error);
    }
  };
}

module.exports = {
  setTransactionBitFlags: setTransactionBitFlags,
  createTxJSON: createTxJSON,
  wrapCatch: wrapCatch,
  common: common
};
