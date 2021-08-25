import BigNumber from 'bignumber.js'
import * as common from '../common'
import {Memo} from '../common/types/objects'
import {Instructions, Prepare, TransactionJSON} from './types'
import {toRippledAmount, dropsToXrp, removeUndefined, xrpToDrops} from '../utils'
import {Client} from '..'
import {ValidationError} from '../common/errors'
import {xAddressToClassicAddress, isValidXAddress} from 'ripple-address-codec'

const txFlags = common.txFlags
const TRANSACTION_TYPES_WITH_DESTINATION_TAG_FIELD = [
  'Payment',
  'CheckCreate',
  'EscrowCreate',
  'PaymentChannelCreate'
]

export type ApiMemo = {
  MemoData?: string
  MemoType?: string
  MemoFormat?: string
}

function formatPrepareResponse(txJSON: any): Prepare {
  const instructions = {
    fee: dropsToXrp(txJSON.Fee),
    maxLedgerVersion:
      txJSON.LastLedgerSequence == null ? null : txJSON.LastLedgerSequence
  }
  if (txJSON.TicketSequence != null) {
    instructions['ticketSequence'] = txJSON.TicketSequence
  } else {
    instructions['sequence'] = txJSON.Sequence
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
  return new BigNumber(value).times(multiplier).plus(extra).toString()
}

/**
 * @typedef {Object} ClassicAccountAndTag
 * @property {string} classicAccount - The classic account address.
 * @property {number | false | undefined } tag - The destination tag;
 *                    `false` if no tag should be used;
 *                    `undefined` if the input could not specify whether a tag should be used.
 */
export interface ClassicAccountAndTag {
  classicAccount: string
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
function getClassicAccountAndTag(
  Account: string,
  expectedTag?: number
): ClassicAccountAndTag {
  if (isValidXAddress(Account)) {
    const classic = xAddressToClassicAddress(Account)
    if (expectedTag != null && classic.tag !== expectedTag) {
      throw new ValidationError(
        'address includes a tag that does not match the tag specified in the transaction'
      )
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

function prepareTransaction(
  txJSON: TransactionJSON,
  client: Client,
  instructions: Instructions
): Promise<Prepare> {
  common.validate.instructions(instructions)
  common.validate.tx_json(txJSON)

  // We allow 0 values in the Sequence schema to support the Tickets feature
  // When a ticketSequence is used, sequence has to be 0
  // We validate that a sequence with value 0 is not passed even if the json schema allows it
  if (instructions.sequence != null && instructions.sequence === 0) {
    return Promise.reject(new ValidationError('`sequence` cannot be 0'))
  }

  const disallowedFieldsInTxJSON = [
    'maxLedgerVersion',
    'maxLedgerVersionOffset',
    'fee',
    'sequence',
    'ticketSequence'
  ]
  const badFields = disallowedFieldsInTxJSON.filter((field) => txJSON[field])
  if (badFields.length) {
    return Promise.reject(
      new ValidationError(
        'txJSON additionalProperty "' +
          badFields[0] +
          '" exists in instance when not allowed'
      )
    )
  }

  const newTxJSON = Object.assign({}, txJSON)

  // To remove the signer list, `SignerEntries` field should be omitted.
  if (txJSON['SignerQuorum'] === 0) {
    delete newTxJSON.SignerEntries
  }

  // Sender:
  const {classicAccount, tag: sourceTag} = getClassicAccountAndTag(
    txJSON.Account
  )
  newTxJSON.Account = classicAccount
  if (sourceTag != null) {
    if (txJSON.SourceTag && txJSON.SourceTag !== sourceTag) {
      return Promise.reject(
        new ValidationError(
          'The `SourceTag`, if present, must match the tag of the `Account` X-address'
        )
      )
    }
    if (sourceTag) {
      newTxJSON.SourceTag = sourceTag
    }
  }

  // Destination:
  if (typeof txJSON.Destination === 'string') {
    const {
      classicAccount: destinationAccount,
      tag: destinationTag
    } = getClassicAccountAndTag(txJSON.Destination)
    newTxJSON.Destination = destinationAccount
    if (destinationTag != null) {
      if (
        TRANSACTION_TYPES_WITH_DESTINATION_TAG_FIELD.includes(
          txJSON.TransactionType
        )
      ) {
        if (txJSON.DestinationTag && txJSON.DestinationTag !== destinationTag) {
          return Promise.reject(
            new ValidationError(
              'The Payment `DestinationTag`, if present, must match the tag of the `Destination` X-address'
            )
          )
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

  function convertIssuedCurrencyToAccountIfPresent(fieldName: string): void {
    const amount = txJSON[fieldName]
    if (typeof amount  === 'number'
     || amount instanceof Array
     || amount == null)
      return

    newTxJSON[fieldName] = toRippledAmount(amount)
  }

  // DepositPreauth:
  convertToClassicAccountIfPresent('Authorize')
  convertToClassicAccountIfPresent('Unauthorize')

  // EscrowCancel, EscrowFinish:
  convertToClassicAccountIfPresent('Owner')

  // SetRegularKey:
  convertToClassicAccountIfPresent('RegularKey')

  // Payment
  convertIssuedCurrencyToAccountIfPresent('Amount')
  convertIssuedCurrencyToAccountIfPresent('SendMax')
  convertIssuedCurrencyToAccountIfPresent('DeliverMin')

  // OfferCreate
  convertIssuedCurrencyToAccountIfPresent('TakerPays')
  convertIssuedCurrencyToAccountIfPresent('TakerGets')

  // TrustSet
  convertIssuedCurrencyToAccountIfPresent('LimitAmount')

  setCanonicalFlag(newTxJSON)

  function prepareMaxLedgerVersion(): Promise<void> {
    // Up to one of the following is allowed:
    //   txJSON.LastLedgerSequence
    //   instructions.maxLedgerVersion
    //   instructions.maxLedgerVersionOffset
    if (newTxJSON.LastLedgerSequence && instructions.maxLedgerVersion) {
      return Promise.reject(
        new ValidationError(
          '`LastLedgerSequence` in txJSON and `maxLedgerVersion`' +
            ' in `instructions` cannot both be set'
        )
      )
    }
    if (newTxJSON.LastLedgerSequence && instructions.maxLedgerVersionOffset) {
      return Promise.reject(
        new ValidationError(
          '`LastLedgerSequence` in txJSON and `maxLedgerVersionOffset`' +
            ' in `instructions` cannot both be set'
        )
      )
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
    const offset =
      instructions.maxLedgerVersionOffset != null
        ? instructions.maxLedgerVersionOffset
        : 3
    return client.request({command: 'ledger_current'})
    .then(response => response.result.ledger_current_index)
    .then((ledgerVersion) => {
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
      return Promise.reject(
        new ValidationError(
          '`Fee` in txJSON and `fee` in `instructions` cannot both be set'
        )
      )
    }
    if (newTxJSON.Fee) {
      // txJSON.Fee is set. Use this value and do not scale it.
      return Promise.resolve()
    }
    const multiplier =
      instructions.signersCount == null
        ? 1
        : instructions.signersCount + 1
    if (instructions.fee != null) {
      const fee = new BigNumber(instructions.fee)
      if (fee.isGreaterThan(client._maxFeeXRP)) {
        return Promise.reject(
          new ValidationError(
            `Fee of ${fee.toString(10)} XRP exceeds ` +
              `max of ${client._maxFeeXRP} XRP. To use this fee, increase ` +
              '`maxFeeXRP` in the Client constructor.'
          )
        )
      }
      newTxJSON.Fee = scaleValue(
        xrpToDrops(instructions.fee),
        multiplier
      )
      return Promise.resolve()
    }
    const cushion = client._feeCushion
    return client.getFee(cushion).then((fee) => {
      return client.request({command: 'fee'})
      .then(response => Number(response.result.drops.minimum_fee))
      .then((feeRef) => {
        // feeRef is the reference transaction cost in "fee units"
        const extraFee =
          newTxJSON.TransactionType !== 'EscrowFinish' ||
          newTxJSON.Fulfillment == null
            ? 0
            : cushion *
              feeRef *
              (32 +
                Math.floor(
                  Buffer.from(newTxJSON.Fulfillment, 'hex').length / 16
                ))
        const feeDrops = xrpToDrops(fee)
        const maxFeeXRP = instructions.maxFee
          ? BigNumber.min(client._maxFeeXRP, instructions.maxFee)
          : client._maxFeeXRP
        const maxFeeDrops = xrpToDrops(maxFeeXRP)
        const normalFee = scaleValue(feeDrops, multiplier, extraFee)
        newTxJSON.Fee = BigNumber.min(normalFee, maxFeeDrops).toString(10)

        return
      })
    })
  }

  async function prepareSequence(): Promise<void> {
    if (instructions.sequence != null) {
      if (
        newTxJSON.Sequence == null ||
        instructions.sequence === newTxJSON.Sequence
      ) {
        newTxJSON.Sequence = instructions.sequence
        return Promise.resolve()
      } else {
        // Both txJSON.Sequence and instructions.sequence are defined, and they are NOT equal
        return Promise.reject(
          new ValidationError(
            '`Sequence` in txJSON must match `sequence` in `instructions`'
          )
        )
      }
    }

    if (newTxJSON.Sequence != null) {
      return Promise.resolve()
    }

    // Ticket Sequence
    if (instructions.ticketSequence != null) {
      newTxJSON.Sequence = 0
      newTxJSON.TicketSequence = instructions.ticketSequence
      return Promise.resolve()
    }

    try {
      const response = await client.request({command: 'account_info',
        account: classicAccount,
        ledger_index: 'current' // Fix #999
      })
      newTxJSON.Sequence = response.result.account_data.Sequence
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
    Memo: removeUndefined({
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
