/* @flow */
'use strict' // eslint-disable-line strict
const _ = require('lodash')
const BigNumber = require('bignumber.js')
const common = require('../common')
const txFlags = common.txFlags
import type {Instructions, Prepare} from './types.js'

function formatPrepareResponse(txJSON: Object): Object {
  const instructions = {
    fee: common.dropsToXrp(txJSON.Fee),
    sequence: txJSON.Sequence,
    maxLedgerVersion: txJSON.LastLedgerSequence === undefined ?
      null : txJSON.LastLedgerSequence
  }
  return {
    txJSON: JSON.stringify(txJSON),
    instructions: _.omit(instructions, _.isUndefined)
  }
}

function setCanonicalFlag(txJSON) {
  txJSON.Flags |= txFlags.Universal.FullyCanonicalSig

  // JavaScript converts operands to 32-bit signed ints before doing bitwise
  // operations. We need to convert it back to an unsigned int.
  txJSON.Flags = txJSON.Flags >>> 0
}

function scaleValue(value, multiplier, extra = 0) {
  return (new BigNumber(value)).times(multiplier).plus(extra).toString()
}

function prepareTransaction(txJSON: Object, api: Object,
    instructions: Instructions
): Promise<Prepare> {
  common.validate.instructions(instructions)

  const account = txJSON.Account
  setCanonicalFlag(txJSON)

  function prepareMaxLedgerVersion(): Promise<Object> {
    if (instructions.maxLedgerVersion !== undefined) {
      if (instructions.maxLedgerVersion !== null) {
        txJSON.LastLedgerSequence = instructions.maxLedgerVersion
      }
      return Promise.resolve(txJSON)
    }
    const offset = instructions.maxLedgerVersionOffset !== undefined ?
      instructions.maxLedgerVersionOffset : 3
    return api.connection.getLedgerVersion().then(ledgerVersion => {
      txJSON.LastLedgerSequence = ledgerVersion + offset
      return txJSON
    })
  }

  function prepareFee(): Promise<Object> {
    const multiplier = instructions.signersCount === undefined ? 1 :
      instructions.signersCount + 1
    if (instructions.fee !== undefined) {
      txJSON.Fee = scaleValue(common.xrpToDrops(instructions.fee), multiplier)
      return Promise.resolve(txJSON)
    }
    const cushion = api._feeCushion
    return common.serverInfo.getFee(api.connection, cushion).then(fee => {
      return api.connection.getFeeRef().then(feeRef => {
        const extraFee =
          (txJSON.TransactionType !== 'EscrowFinish' ||
            txJSON.Fulfillment === undefined) ? 0 :
          (cushion * feeRef * (32 + Math.floor(
            new Buffer(txJSON.Fulfillment, 'hex').length / 16)))
        const feeDrops = common.xrpToDrops(fee)
        if (instructions.maxFee !== undefined) {
          const maxFeeDrops = common.xrpToDrops(instructions.maxFee)
          const normalFee = scaleValue(feeDrops, multiplier, extraFee)
          txJSON.Fee = BigNumber.min(normalFee, maxFeeDrops).toString()
        } else {
          txJSON.Fee = scaleValue(feeDrops, multiplier, extraFee)
        }
        return txJSON
      })
    })
  }

  function prepareSequence(): Promise<Object> {
    if (instructions.sequence !== undefined) {
      txJSON.Sequence = instructions.sequence
      return Promise.resolve(txJSON)
    }
    const request = {
      command: 'account_info',
      account: account
    }
    return api.connection.request(request).then(response => {
      txJSON.Sequence = response.account_data.Sequence
      return txJSON
    })
  }

  return Promise.all([
    prepareMaxLedgerVersion(),
    prepareFee(),
    prepareSequence()
  ]).then(() => formatPrepareResponse(txJSON))
}

function convertStringToHex(string: string) {
  return string ? (new Buffer(string, 'utf8')).toString('hex').toUpperCase() :
    undefined
}

function convertMemo(memo: Object): Object {
  return {
    Memo: common.removeUndefined({
      MemoData: convertStringToHex(memo.data),
      MemoType: convertStringToHex(memo.type),
      MemoFormat: convertStringToHex(memo.format)
    })
  }
}

module.exports = {
  convertStringToHex,
  convertMemo,
  prepareTransaction,
  common
}
