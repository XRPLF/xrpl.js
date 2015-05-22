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
function setTransactionBitFlags(transaction, options) {
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

function createTxJSON(transaction, remote, instructions, callback) {
  common.validate.options(instructions);

  transaction.complete();
  const account = transaction.getAccount();
  const tx_json = transaction.tx_json;

  if (instructions.last_ledger_sequence !== undefined) {
    tx_json.LastLedgerSequence =
      parseInt(instructions.last_ledger_sequence, 10);
  } else {
    const offset = instructions.last_ledger_offset !== undefined ?
      parseInt(instructions.last_ledger_offset, 10) : 3;
    tx_json.LastLedgerSequence = remote.getLedgerSequence() + offset;
  }

  if (instructions.fixed_fee !== undefined) {
    tx_json.Fee = common.xrpToDrops(instructions.fixed_fee);
  } else {
    const serverFeeDrops = getFeeDrops(remote);
    if (instructions.max_fee !== undefined) {
      const maxFeeDrops = common.xrpToDrops(instructions.max_fee);
      tx_json.Fee = BigNumber.min(serverFeeDrops, maxFeeDrops).toString();
    } else {
      tx_json.Fee = serverFeeDrops;
    }
  }

  if (instructions.sequence !== undefined) {
    tx_json.Sequence = parseInt(instructions.sequence, 10);
    callback(null, {tx_json: tx_json});
  } else {
    remote.findAccount(account).getNextSequence(function(error, sequence) {
      tx_json.Sequence = sequence;
      callback(null, {tx_json: tx_json});
    });
  }
}

function wrapCatch(asyncFunction) {
  return function() {
    const callback = arguments[arguments.length - 1];
    try {
      asyncFunction.apply(this, arguments);
    } catch (error) {
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
