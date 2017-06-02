/* @flow */
'use strict' // eslint-disable-line strict
const utils = require('./utils')
const keypairs = require('ripple-keypairs')
const binary = require('ripple-binary-codec')
const {computeBinaryTransactionHash} = require('ripple-hashes')
const validate = utils.common.validate

function computeSignature(tx: Object, privateKey: string, signAs: ?string) {
  const signingData = signAs ?
    binary.encodeForMultisigning(tx, signAs) : binary.encodeForSigning(tx)
  return keypairs.sign(signingData, privateKey)
}

function signWithKeypair(txJSON: string, keypair: Object = {}, options: Object = {}
): {signedTransaction: string; id: string} {

  const tx = JSON.parse(txJSON)
  if (tx.TxnSignature || tx.Signers) {
    throw new utils.common.errors.ValidationError(
      'txJSON must not contain "TxnSignature" or "Signers" properties')
  }

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
  return {
    signedTransaction: serialized,
    id: computeBinaryTransactionHash(serialized)
  }
}

module.exports = signWithKeypair