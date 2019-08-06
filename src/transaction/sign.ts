import * as isEqual from '../common/js/lodash.isequal'
import * as utils from './utils'
import keypairs = require('ripple-keypairs')
import binary = require('ripple-binary-codec')
import {computeBinaryTransactionHash} from 'ripple-hashes'
import {SignOptions, KeyPair} from './types'
import {BigNumber} from 'bignumber.js'
import {xrpToDrops} from '../common'
import {RippleAPI} from '..'
const validate = utils.common.validate

function computeSignature(tx: object, privateKey: string, signAs?: string) {
  const signingData = signAs
    ? binary.encodeForMultisigning(tx, signAs)
    : binary.encodeForSigning(tx)
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

  tx.SigningPubKey = options.signAs ? '' : keypair.publicKey

  if (options.signAs) {
    const signer = {
      Account: options.signAs,
      SigningPubKey: keypair.publicKey,
      TxnSignature: computeSignature(tx, keypair.privateKey, options.signAs)
    }
    tx.Signers = [{Signer: signer}]
  } else {
    tx.TxnSignature = computeSignature(tx, keypair.privateKey)
  }

  const serialized = binary.encode(tx)

  // Decode the serialized transaction:
  const decoded = binary.decode(serialized)

  // ...And ensure it is equal to the original tx, except:
  // - It must have a TxnSignature or txSigners (multisign).
  if (!decoded.TxnSignature && !tx.Signers) {
    throw new utils.common.errors.ValidationError(
      'Serialized signed transaction is missing "TxnSignature" property'
    )
  }
  // - We know that the original tx did not have TxnSignature, so we should delete it:
  delete decoded.TxnSignature
  // - We know that the original tx did not have Signers, so we should delete it:
  delete decoded.Signers

  // - If SigningPubKey was not in the original tx, then we should delete it:
  const parsedTxJSON = JSON.parse(txJSON)
  if (!parsedTxJSON.SigningPubKey) {
    delete decoded.SigningPubKey
  }

  // - We know that the original tx did not have Signers, so if it exists, we should delete it:
  delete decoded.Signers

  if (!isEqual(decoded, parsedTxJSON)) {
    const error = new utils.common.errors.ValidationError(
      'Serialized transaction does not match original txJSON'
    )
    error.data = {
      decoded,
      parsedTxJSON
    }
    throw error
  }

  checkFee(api, decoded.Fee)

  return {
    signedTransaction: serialized,
    id: computeBinaryTransactionHash(serialized)
  }
}

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
