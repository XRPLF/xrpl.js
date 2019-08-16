import * as isEqual from '../common/js/lodash.isequal'
import * as utils from './utils'
import keypairs = require('ripple-keypairs')
import binaryCodec = require('ripple-binary-codec')
import {computeBinaryTransactionHash} from 'ripple-hashes'
import {SignOptions, KeyPair} from './types'
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
): { signedTransaction: string; id: string } {
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
      TxnSignature: computeSignature(txToSignAndEncode, keypair.privateKey, options.signAs)
    }
    txToSignAndEncode.Signers = [{Signer: signer}]
  } else {
    txToSignAndEncode.TxnSignature = computeSignature(txToSignAndEncode, keypair.privateKey)
  }

  const serialized = binaryCodec.encode(txToSignAndEncode)

  checkTxSerialization(serialized, tx)

  return {
    signedTransaction: serialized,
    id: computeBinaryTransactionHash(serialized)
  }
}

/**
 *  Decode a serialized transaction, remove the fields that are added during the signing process,
 *  and verify that it matches the transaction prior to signing.
 *
 *  @param {string} serialized A signed and serialized transaction.
 *  @param {utils.TransactionJSON} tx The transaction prior to signing.
 *
 *  @returns {void} This method does not return a value, but throws an error if the check fails.
 */
function checkTxSerialization(serialized: string, tx: utils.TransactionJSON): void {
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
      'Serialized transaction does not match original txJSON'
    )
    error.data = {
      decoded,
      tx
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
  if (fee.greaterThan(maxFeeDrops)) {
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
): { signedTransaction: string; id: string } {
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
    return signWithKeypair(
      this,
      txJSON,
      keypair ? keypair : secret,
      options)
  }
}

export default sign
