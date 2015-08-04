/* @flow */
'use strict';
const BigNumber = require('bignumber.js');
const common = require('../common');

function setTransactionBitFlags(transaction: any, values: any, flags: any):
    void {
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

function getFeeDrops(remote) {
  const feeUnits = 10; // all transactions currently have a fee of 10 fee units
  return remote.feeTx(feeUnits).to_text();
}

function createTxJSON(transaction: any, remote: any, instructions: any,
    callback: (err: ?(typeof Error), data: {tx_json: any}) => void): void {
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

module.exports = {
  setTransactionBitFlags: setTransactionBitFlags,
  createTxJSON: createTxJSON,
  common: common,
  promisify: common.promisify
};
