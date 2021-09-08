import { xAddressToClassicAddress, isValidXAddress } from 'ripple-address-codec'

import * as common from '../common'
import { ValidationError } from '../common/errors'
import { Memo } from '../common/types/objects'
import { removeUndefined } from '../utils'

import { TransactionJSON } from './types'

const txFlags = common.txFlags

export interface ApiMemo {
  MemoData?: string
  MemoType?: string
  MemoFormat?: string
}

// TODO: move relevant methods from here to `src/utils` (such as `convertStringToHex`?)

/**
 *  Set the `tfFullyCanonicalSig` flag on a transaction.
 *
 *  See https://xrpl.org/transaction-malleability.html.
 *
 * @param txJSON - The transaction object to modify.
 *    This method will modify object's `Flags` property, or add it if it does not exist.
 *
 * @returns This method mutates the original txJSON and does not return a value.
 */
function setCanonicalFlag(txJSON: TransactionJSON): void {
  if (txJSON.Flags == null) {
    txJSON.Flags = 0
  }

  txJSON.Flags |= txFlags.Universal.FullyCanonicalSig

  // JavaScript converts operands to 32-bit signed ints before doing bitwise
  // operations. We need to convert it back to an unsigned int.
  txJSON.Flags >>>= 0
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
 * @param Account - The address to parse.
 * @param expectedTag - If provided, and the `Account` is an X-address,
 *                    this method throws an error if `expectedTag`
 *                    does not match the tag of the X-address.
 * @returns
 *          The classic account and tag.
 */
function getClassicAccountAndTag(
  Account: string,
  expectedTag?: number,
): ClassicAccountAndTag {
  if (isValidXAddress(Account)) {
    const classic = xAddressToClassicAddress(Account)
    if (expectedTag != null && classic.tag !== expectedTag) {
      throw new ValidationError(
        'address includes a tag that does not match the tag specified in the transaction',
      )
    }
    return {
      classicAccount: classic.classicAddress,
      tag: classic.tag,
    }
  }
  return {
    classicAccount: Account,
    tag: expectedTag,
  }
}

function convertStringToHex(string: string): string {
  return Buffer.from(string, 'utf8').toString('hex').toUpperCase()
}

function convertMemo(memo: Memo): { Memo: ApiMemo } {
  return {
    Memo: removeUndefined({
      MemoData: memo.data ? convertStringToHex(memo.data) : undefined,
      MemoType: memo.type ? convertStringToHex(memo.type) : undefined,
      MemoFormat: memo.format ? convertStringToHex(memo.format) : undefined,
    }),
  }
}

export {
  convertStringToHex,
  convertMemo,
  common,
  setCanonicalFlag,
  getClassicAccountAndTag,
}
