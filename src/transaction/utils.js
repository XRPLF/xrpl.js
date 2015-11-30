/* @flow */
'use strict';
const _ = require('lodash');
const BigNumber = require('bignumber.js');
const common = require('../common');
const txFlags = common.txFlags;
import type {Instructions, Prepare} from './types.js';

function formatPrepareResponse(txJSON: Object): Object {
  const instructions = {
    fee: common.dropsToXrp(txJSON.Fee),
    sequence: txJSON.Sequence,
    maxLedgerVersion: txJSON.LastLedgerSequence === undefined ?
      null : txJSON.LastLedgerSequence
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

function prepareTransaction(txJSON: Object, api: Object,
    instructions: Instructions
): Promise<Prepare> {
  common.validate.instructions(instructions);

  const account = txJSON.Account;
  setCanonicalFlag(txJSON);

  function prepareMaxLedgerVersion(): Promise<Object> {
    if (instructions.maxLedgerVersion !== undefined) {
      if (instructions.maxLedgerVersion !== null) {
        txJSON.LastLedgerSequence = instructions.maxLedgerVersion;
      }
      return Promise.resolve(txJSON);
    }
    const offset = instructions.maxLedgerVersionOffset !== undefined ?
      instructions.maxLedgerVersionOffset : 3;
    return api.connection.getLedgerVersion().then(ledgerVersion => {
      txJSON.LastLedgerSequence = ledgerVersion + offset;
      return txJSON;
    });
  }

  function prepareFee(): Promise<Object> {
    if (instructions.fee !== undefined) {
      txJSON.Fee = common.xrpToDrops(instructions.fee);
      return Promise.resolve(txJSON);
    }
    const cushion = api._feeCushion;
    return common.serverInfo.getFee(api.connection, cushion).then(fee => {
      const feeDrops = common.xrpToDrops(fee);
      if (instructions.maxFee !== undefined) {
        const maxFeeDrops = common.xrpToDrops(instructions.maxFee);
        txJSON.Fee = BigNumber.min(feeDrops, maxFeeDrops).toString();
      } else {
        txJSON.Fee = feeDrops;
      }
      return txJSON;
    });
  }

  function prepareSequence(): Promise<Object> {
    if (instructions.sequence !== undefined) {
      txJSON.Sequence = instructions.sequence;
      return Promise.resolve(txJSON);
    }
    const request = {
      command: 'account_info',
      account: account
    };
    return api.connection.request(request).then(response => {
      txJSON.Sequence = response.account_data.Sequence;
      return txJSON;
    });
  }

  return Promise.all([
    prepareMaxLedgerVersion(),
    prepareFee(),
    prepareSequence()
  ]).then(() => formatPrepareResponse(txJSON));
}

function convertStringToHex(string: string) {
  return string ? (new Buffer(string, 'utf8')).toString('hex').toUpperCase() :
    undefined;
}

function convertMemo(memo: Object): Object {
  return {
    Memo: common.removeUndefined({
      MemoData: convertStringToHex(memo.data),
      MemoType: convertStringToHex(memo.type),
      MemoFormat: convertStringToHex(memo.format)
    })
  };
}

module.exports = {
  convertStringToHex,
  convertMemo,
  prepareTransaction,
  common
};
