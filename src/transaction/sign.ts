import isEqual from 'lodash.isequal'
import * as utils from './utils'
import keypairs from 'ripple-keypairs'
import binaryCodec from 'ripple-binary-codec'
import {computeBinaryTransactionHash} from '../common/hashes'
import {SignOptions, KeyPair, TransactionJSON} from './types'
import {BigNumber} from 'bignumber.js'
import {xrpToDrops} from '../common'
import {RippleAPI} from '..'
const validate = utils.common.validate

function computeSignature(tx: object, privateKey: string, signAs?: string) {
  const signingData = signAs
    ? binaryCodec.encodeForMultisigning(tx, signAs)
    : binaryCodec.encodeForSigning(tx)
  return keypairs.sign(signingData, privateKey)
}

function signWithKeypair(
  api: RippleAPI,
  txJSON: string,
  keypair: KeyPair,
  options: SignOptions = {
    signAs: ''
  }
): {signedTransaction: string; id: string} {
  validate.sign({txJSON, keypair})

  const tx = JSON.parse(txJSON)
  if (tx.TxnSignature || tx.Signers) {
    throw new utils.common.errors.ValidationError(
      'txJSON must not contain "TxnSignature" or "Signers" properties'
    )
  }

  checkFee(api, tx.Fee)

  const txToSignAndEncode = Object.assign({}, tx)

  txToSignAndEncode.SigningPubKey = options.signAs ? '' : keypair.publicKey

  if (options.signAs) {
    const signer = {
      Account: options.signAs,
      SigningPubKey: keypair.publicKey,
      TxnSignature: computeSignature(
        txToSignAndEncode,
        keypair.privateKey,
        options.signAs
      )
    }
    txToSignAndEncode.Signers = [{Signer: signer}]
  } else {
    txToSignAndEncode.TxnSignature = computeSignature(
      txToSignAndEncode,
      keypair.privateKey
    )
  }
  const serialized = binaryCodec.encode(txToSignAndEncode)
  checkTxSerialization(serialized, tx)
  return {
    signedTransaction: serialized,
    id: computeBinaryTransactionHash(serialized)
  }
}

/**
 * Compares two objects and creates a diff.
 *
 * @param a An object to compare.
 * @param b The other object to compare with.
 *
 * @returns An object containing the differences between the two objects.
 */
function objectDiff(a: object, b: object): object {
  const diffs = {}

  // Compare two items and push non-matches to object
  const compare = function (i1: any, i2: any, k: string): void {
    const type1 = Object.prototype.toString.call(i1)
    const type2 = Object.prototype.toString.call(i2)
    if (type2 === '[object Undefined]') {
      diffs[k] = null // Indicate that the item has been removed
      return
    }
    if (type1 !== type2) {
      diffs[k] = i2 // Indicate that the item has changed types
      return
    }
    if (type1 === '[object Object]') {
      const objDiff = objectDiff(i1, i2)
      if (Object.keys(objDiff).length > 0) {
        diffs[k] = objDiff
      }
      return
    }
    if (type1 === '[object Array]') {
      if (!isEqual(i1, i2)) {
        diffs[k] = i2 // If arrays do not match, add second item to diffs
      }
      return
    }
    if (type1 === '[object Function]') {
      if (i1.toString() !== i2.toString()) {
        diffs[k] = i2 // If functions differ, add second one to diffs
      }
      return
    }
    if (i1 !== i2) {
      diffs[k] = i2
    }
  }

  // Check items in first object
  for (const key in a) {
    if (a.hasOwnProperty(key)) {
      compare(a[key], b[key], key)
    }
  }

  // Get items that are in the second object but not the first
  for (const key in b) {
    if (b.hasOwnProperty(key)) {
      if (!a[key] && a[key] !== b[key]) {
        diffs[key] = b[key]
      }
    }
  }

  return diffs
}

/**
 *  Decode a serialized transaction, remove the fields that are added during the signing process,
 *  and verify that it matches the transaction prior to signing.
 *
 *  @param {string} serialized A signed and serialized transaction.
 *  @param {TransactionJSON} tx The transaction prior to signing.
 *
 *  @returns {void} This method does not return a value, but throws an error if the check fails.
 */
function checkTxSerialization(serialized: string, tx: TransactionJSON): void {
  // Decode the serialized transaction:
  const decoded = binaryCodec.decode(serialized)

  // ...And ensure it is equal to the original tx, except:
  // - It must have a TxnSignature or Signers (multisign).
  if (!decoded.TxnSignature && !decoded.Signers) {
    throw new utils.common.errors.ValidationError(
      'Serialized transaction must have a TxnSignature or Signers property'
    )
  }
  // - We know that the original tx did not have TxnSignature, so we should delete it:
  delete decoded.TxnSignature
  // - We know that the original tx did not have Signers, so if it exists, we should delete it:
  delete decoded.Signers

  // - If SigningPubKey was not in the original tx, then we should delete it.
  //   But if it was in the original tx, then we should ensure that it has not been changed.
  if (!tx.SigningPubKey) {
    delete decoded.SigningPubKey
  }

  if (!isEqual(decoded, tx)) {
    const error = new utils.common.errors.ValidationError(
      'Serialized transaction does not match original txJSON. See `error.data`'
    )
    error.data = {
      decoded,
      tx,
      diff: objectDiff(tx, decoded)
    }
    throw error
  }
}

/**
 *  Check that a given transaction fee does not exceed maxFeeXRP (in drops).
 *
 *  See https://xrpl.org/rippleapi-reference.html#parameters
 *
 *  @param {RippleAPI} api A RippleAPI instance.
 *  @param {string} txFee The transaction fee in drops, encoded as a string.
 *
 *  @returns {void} This method does not return a value, but throws an error if the check fails.
 */
function checkFee(api: RippleAPI, txFee: string): void {
  const fee = new BigNumber(txFee)
  const maxFeeDrops = xrpToDrops(api._maxFeeXRP)
  if (fee.isGreaterThan(maxFeeDrops)) {
    throw new utils.common.errors.ValidationError(
      `"Fee" should not exceed "${maxFeeDrops}". ` +
        'To use a higher fee, set `maxFeeXRP` in the RippleAPI constructor.'
    )
  }
}

function sign(
  this: RippleAPI,
  txJSON: string,
  secret?: any,
  options?: SignOptions,
  keypair?: KeyPair
): {signedTransaction: string; id: string} {
  if (typeof secret === 'string') {
    // we can't validate that the secret matches the account because
    // the secret could correspond to the regular key
    validate.sign({txJSON, secret})
    return signWithKeypair(
      this,
      txJSON,
      keypairs.deriveKeypair(secret),
      options
    )
  } else {
    if (!keypair && !secret) {
      // Clearer message than 'ValidationError: instance is not exactly one from [subschema 0],[subschema 1]'
      throw new utils.common.errors.ValidationError(
        'sign: Missing secret or keypair.'
      )
    }
    return signWithKeypair(this, txJSON, keypair ? keypair : secret, options)
  }
}

export default sign
