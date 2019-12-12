import BigNumber from 'bignumber.js'
import * as common from '../common'
import {Memo} from '../common/types/objects'
import {Instructions, Prepare, TransactionJSON} from './types'
import {RippleAPI} from '..'
import {ValidationError} from '../common/errors'
import {xAddressToClassicAddress, isValidXAddress} from 'ripple-address-codec'

const txFlags = common.txFlags
const TRANSACTION_TYPES_WITH_DESTINATION_TAG_FIELD = ['Payment', 'CheckCreate', 'EscrowCreate', 'PaymentChannelCreate']

export type ApiMemo = {
  MemoData?: string,
  MemoType?: string,
  MemoFormat?: string
}

function formatPrepareResponse(txJSON: any): Prepare {
  const instructions = {
    fee: common.dropsToXrp(txJSON.Fee),
    sequence: txJSON.Sequence,
    maxLedgerVersion: txJSON.LastLedgerSequence === undefined ?
      null : txJSON.LastLedgerSequence
  }
  return {
    txJSON: JSON.stringify(txJSON),
    instructions
  }
}

/**
 *  Set the `tfFullyCanonicalSig` flag on a transaction.
 *
 *  See https://xrpl.org/transaction-malleability.html
 *
 *  @param {TransactionJSON} txJSON The transaction object to modify.
 *    This method will modify object's `Flags` property, or add it if it does not exist.
 *
 *  @returns {void} This method mutates the original txJSON and does not return a value.
 */
function setCanonicalFlag(txJSON: TransactionJSON): void {
  txJSON.Flags |= txFlags.Universal.FullyCanonicalSig

  // JavaScript converts operands to 32-bit signed ints before doing bitwise
  // operations. We need to convert it back to an unsigned int.
  txJSON.Flags = txJSON.Flags >>> 0
}

function scaleValue(value, multiplier, extra = 0) {
  return (new BigNumber(value)).times(multiplier).plus(extra).toString()
}

/**
 * @typedef {Object} ClassicAccountAndTag
 * @property {string} classicAccount - The classic account address.
 * @property {number | false | undefined } tag - The destination tag;
 *                    `false` if no tag should be used;
 *                    `undefined` if the input could not specify whether a tag should be used.
 */
export interface ClassicAccountAndTag {
  classicAccount: string,
  tag: number | false | undefined
}

/**
 * Given an address (account), get the classic account and tag.
 * If an `expectedTag` is provided:
 * 1. If the `Account` is an X-address, validate that the tags match.
 * 2. If the `Account` is a classic address, return `expectedTag` as the tag.
 *
 * @param Account The address to parse.
 * @param expectedTag If provided, and the `Account` is an X-address,
 *                    this method throws an error if `expectedTag`
 *                    does not match the tag of the X-address.
 * @returns {ClassicAccountAndTag}
 *          The classic account and tag.
 */
function getClassicAccountAndTag(Account: string, expectedTag?: number): ClassicAccountAndTag {
  if (isValidXAddress(Account)) {
    const classic = xAddressToClassicAddress(Account)
    if (expectedTag !== undefined && classic.tag !== expectedTag) {
      throw new ValidationError('address includes a tag that does not match the tag specified in the transaction')
    }
    return {
      classicAccount: classic.classicAddress,
      tag: classic.tag
    }
  } else {
    return {
      classicAccount: Account,
      tag: expectedTag
    }
  }
}

function prepareTransaction(txJSON: TransactionJSON, api: RippleAPI,
  instructions: Instructions
): Promise<Prepare> {
  common.validate.instructions(instructions)
  common.validate.tx_json(txJSON)
  const disallowedFieldsInTxJSON = ['maxLedgerVersion', 'maxLedgerVersionOffset', 'fee', 'sequence']
  const badFields = disallowedFieldsInTxJSON.filter(field => txJSON[field])
  if (badFields.length) {
    return Promise.reject(new ValidationError('txJSON additionalProperty "' + badFields[0] +
      '" exists in instance when not allowed'))
  }

  const newTxJSON = Object.assign({}, txJSON)

  // To remove the signer list, `SignerEntries` field should be omitted.
  if (txJSON['SignerQuorum'] === 0) {
    delete newTxJSON.SignerEntries
  }

  // Sender:
  const {classicAccount, tag: sourceTag} = getClassicAccountAndTag(txJSON.Account)
  newTxJSON.Account = classicAccount
  if (sourceTag !== undefined) {
    if (txJSON.SourceTag && txJSON.SourceTag !== sourceTag) {
      return Promise.reject(new ValidationError(
        'The `SourceTag`, if present, must match the tag of the `Account` X-address'))
    }
    if (sourceTag) {
      newTxJSON.SourceTag = sourceTag
    }
  }

  // Destination:
  if (typeof txJSON.Destination === 'string') {
    const {classicAccount: destinationAccount, tag: destinationTag} = getClassicAccountAndTag(txJSON.Destination)
    newTxJSON.Destination = destinationAccount
    if (destinationTag !== undefined) {
      if (TRANSACTION_TYPES_WITH_DESTINATION_TAG_FIELD.includes(txJSON.TransactionType)) {
        if (txJSON.DestinationTag && txJSON.DestinationTag !== destinationTag) {
          return Promise.reject(new ValidationError(
            'The Payment `DestinationTag`, if present, must match the tag of the `Destination` X-address'))
        }
        if (destinationTag) {
          newTxJSON.DestinationTag = destinationTag
        }
      }
    }
  }

  function convertToClassicAccountIfPresent(fieldName: string): void {
    const account = txJSON[fieldName]
    if (typeof account === 'string') {
      const {classicAccount: ca} = getClassicAccountAndTag(account)
      newTxJSON[fieldName] = ca
    }
  }

  // DepositPreauth:
  convertToClassicAccountIfPresent('Authorize')
  convertToClassicAccountIfPresent('Unauthorize')

  // EscrowCancel, EscrowFinish:
  convertToClassicAccountIfPresent('Owner')

  // SetRegularKey:
  convertToClassicAccountIfPresent('RegularKey')

  setCanonicalFlag(newTxJSON)

  function prepareMaxLedgerVersion(): Promise<void> {
    // Up to one of the following is allowed:
    //   txJSON.LastLedgerSequence
    //   instructions.maxLedgerVersion
    //   instructions.maxLedgerVersionOffset
    if (newTxJSON.LastLedgerSequence && instructions.maxLedgerVersion) {
      return Promise.reject(new ValidationError('`LastLedgerSequence` in txJSON and `maxLedgerVersion`' +
        ' in `instructions` cannot both be set'))
    }
    if (newTxJSON.LastLedgerSequence && instructions.maxLedgerVersionOffset) {
      return Promise.reject(new ValidationError('`LastLedgerSequence` in txJSON and `maxLedgerVersionOffset`' +
        ' in `instructions` cannot both be set'))
    }
    if (newTxJSON.LastLedgerSequence) {
      return Promise.resolve()
    }
    if (instructions.maxLedgerVersion !== undefined) {
      if (instructions.maxLedgerVersion !== null) {
        newTxJSON.LastLedgerSequence = instructions.maxLedgerVersion
      }
      return Promise.resolve()
    }
    const offset = instructions.maxLedgerVersionOffset !== undefined ?
      instructions.maxLedgerVersionOffset : 3
    return api.connection.getLedgerVersion().then(ledgerVersion => {
      newTxJSON.LastLedgerSequence = ledgerVersion + offset
      return
    })
  }

  function prepareFee(): Promise<void> {
    // instructions.fee is scaled (for multi-signed transactions) while txJSON.Fee is not.
    // Due to this difference, we do NOT allow both to be set, as the behavior would be complex and
    // potentially ambiguous.
    // Furthermore, txJSON.Fee is in drops while instructions.fee is in XRP, which would just add to
    // the confusion. It is simpler to require that only one is used.
    if (newTxJSON.Fee && instructions.fee) {
      return Promise.reject(new ValidationError('`Fee` in txJSON and `fee` in `instructions` cannot both be set'))
    }
    if (newTxJSON.Fee) {
      // txJSON.Fee is set. Use this value and do not scale it.
      return Promise.resolve()
    }
    const multiplier = instructions.signersCount === undefined ? 1 :
      instructions.signersCount + 1
    if (instructions.fee !== undefined) {
      const fee = new BigNumber(instructions.fee)
      if (fee.isGreaterThan(api._maxFeeXRP)) {
        return Promise.reject(new ValidationError(`Fee of ${fee.toString(10)} XRP exceeds ` +
          `max of ${api._maxFeeXRP} XRP. To use this fee, increase ` +
          '`maxFeeXRP` in the RippleAPI constructor.'))
      }
      newTxJSON.Fee = scaleValue(common.xrpToDrops(instructions.fee), multiplier)
      return Promise.resolve()
    }
    const cushion = api._feeCushion
    return api.getFee(cushion).then(fee => {
      return api.connection.getFeeRef().then(feeRef => {
        const extraFee =
          (newTxJSON.TransactionType !== 'EscrowFinish' ||
          newTxJSON.Fulfillment === undefined) ? 0 :
            (cushion * feeRef * (32 + Math.floor(
              Buffer.from(newTxJSON.Fulfillment, 'hex').length / 16)))
        const feeDrops = common.xrpToDrops(fee)
        const maxFeeXRP = instructions.maxFee ?
          BigNumber.min(api._maxFeeXRP, instructions.maxFee) : api._maxFeeXRP
        const maxFeeDrops = common.xrpToDrops(maxFeeXRP)
        const normalFee = scaleValue(feeDrops, multiplier, extraFee)
        newTxJSON.Fee = BigNumber.min(normalFee, maxFeeDrops).toString(10)

        return
      })
    })
  }

  async function prepareSequence(): Promise<void> {
    if (instructions.sequence !== undefined) {
      if (newTxJSON.Sequence === undefined || instructions.sequence === newTxJSON.Sequence) {
        newTxJSON.Sequence = instructions.sequence
        return Promise.resolve()
      } else {
        // Both txJSON.Sequence and instructions.sequence are defined, and they are NOT equal
        return Promise.reject(new ValidationError('`Sequence` in txJSON must match `sequence` in `instructions`'))
      }
    }
    if (newTxJSON.Sequence !== undefined) {
      return Promise.resolve()
    }

    try {
      // Consider requesting from the 'current' ledger (instead of 'validated').
      const response = await api.request('account_info', {
        account: classicAccount
      })
      newTxJSON.Sequence = response.account_data.Sequence
      return Promise.resolve()
    } catch (e) {
      return Promise.reject(e)
    }
  }

  return Promise.all([
    prepareMaxLedgerVersion(),
    prepareFee(),
    prepareSequence()
  ]).then(() => formatPrepareResponse(newTxJSON))
}

function convertStringToHex(string: string): string {
return Buffer.from(string, 'utf8').toString('hex').toUpperCase()
}

function convertMemo(memo: Memo): {Memo: ApiMemo} {
  return {
    Memo: common.removeUndefined({
      MemoData: memo.data ? convertStringToHex(memo.data) : undefined,
      MemoType: memo.type ? convertStringToHex(memo.type) : undefined,
      MemoFormat: memo.format ? convertStringToHex(memo.format) : undefined
    })
  }
}

export {
  convertStringToHex,
  convertMemo,
  prepareTransaction,
  common,
  setCanonicalFlag,
  getClassicAccountAndTag
}
